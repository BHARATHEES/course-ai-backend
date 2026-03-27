import { analyzeCourse as callAI } from "../services/aiService.js";
import { getCachedAnalysis, setCachedAnalysis } from "../services/cacheService.js";
import { clearTrendingCache } from "./AnalyticsController.js";
import History   from "../models/History.js";
import User      from "../models/User.js";
import AppError  from "../utils/AppError.js";
import emailService from "../services/emailService.js";

/**
 * POST /api/analyze
 * Returns: { success, isValid, analysis, source, isCached, message }
 */
export const analyzeCourse = async (req, res, next) => {
  try {
    const { courseName } = req.validatedData || req.body;
    const userId = req.user?.userId;

    if (!courseName) return next(new AppError("courseName is required", 400));

    // ── 1. Cache check ───────────────────────────────────────────────────────
    const cached = await getCachedAnalysis(courseName);
    if (cached) {
      if (userId) {
        saveHistory(userId, courseName, cached);
        clearTrendingCache();
      }
      return res.json({
        success: true,
        isValid: true,
        analysis: cached,
        source: "cache",
        isCached: true,
        message: `Cached result for '${courseName}'`,
      });
    }

    // ── 2. AI call ───────────────────────────────────────────────────────────
    const result = await callAI(courseName);

    if (!result?.isValid) {
      return res.json({
        success: true,
        isValid: false,
        analysis: null,
        source: "demo",
        isCached: false,
        message: `Could not recognise '${courseName}'. Try a more specific name.`,
      });
    }

    // ── 3. Persist ───────────────────────────────────────────────────────────
    setCachedAnalysis(courseName, result.analysis).catch(console.error);

    if (userId) {
      saveHistory(userId, courseName, result.analysis);
      clearTrendingCache();
      sendEmail(userId, courseName, result.analysis);
    }

    // ── 4. Respond ───────────────────────────────────────────────────────────
    return res.json({
      success: true,
      isValid: true,
      analysis: result.analysis,
      source: result.source || "huggingface-ai",
      isCached: false,
      message: `Analysis complete for '${courseName}'`,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Private helpers ─────────────────────────────────────────────────────────

function saveHistory(userId, courseName, analysisResult) {
  new History({ userId, courseName, analysisResult })
    .save()
    .catch((e) => console.error("[History] save error:", e.message));
}

async function sendEmail(userId, courseName, analysisResult) {
  try {
    const user = await User.findById(userId).select("email name");
    if (!user?.email) return;
    await emailService.sendAnalysisCompletionEmail({
      recipientEmail: user.email,
      recipientName: user.name || user.email.split("@")[0],
      courseName,
      analysisData: analysisResult,
    });
  } catch (e) {
    console.warn("[Email] analysis email failed:", e.message);
  }
}
