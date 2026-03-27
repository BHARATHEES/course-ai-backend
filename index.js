import dotenv from "dotenv";
dotenv.config();

import express           from "express";
import cors              from "cors";
import cookieParser      from "cookie-parser";
import mongoose          from "mongoose";

// ── Middleware ────────────────────────────────────────────────────────────────
import { authenticate }  from "./middleware/auth.js";
import errorHandler      from "./middleware/errorHandler.js";
import {
  analyzeRateLimit,
  loginRateLimit,
  googleAuthRateLimit,
  generalApiRateLimit,
} from "./middleware/rateLimit.js";
import {
  validateCourseAnalysis,
  validateLoginRequest,
  validateUpdatePasswordRequest,
  validateUpdateProfileRequest,
} from "./middleware/validate.js";

// ── Controllers ───────────────────────────────────────────────────────────────
import {
  handleAuth,
  handleGoogleAuth,
  setAccountPassword,
  updatePassword,
  updateProfile,
}                        from "./controllers/AuthController.js";
import { analyzeCourse } from "./controllers/AnalysisController.js";
import {
  getTrendingCourses,
  getUserAnalytics,
  getDashboardAnalytics,
}                        from "./controllers/AnalyticsController.js";
import {
  saveSearch,
  getHistory,
  deleteHistoryItem,
  deleteAllHistory,
}                        from "./controllers/HistoryController.js";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorited,
  updateFavorite,
}                        from "./controllers/FavoriteController.js";
import {
  getMarketAnalysis,
  getMarketInsights,
  getCompleteMarketAnalysis,
  getTrendInsights,
  getSalaryInsights,
  getDemandInsights,
  getSentimentInsights,
  getHistoricalInsights,
} from "./controllers/MarketAnalysisController.js";
import {
  compareCourses,
  getCourseDefinition,
} from "./controllers/ComparisonController.js";
import { getRoadmap } from "./controllers/RoadmapController.js";

// ── Models (for inline profile-stats route) ───────────────────────────────────
import User    from "./models/User.js";
import History from "./models/History.js";

// ─────────────────────────────────────────────────────────────────────────────

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(cookieParser());
app.use(generalApiRateLimit);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post("/api/auth",           loginRateLimit,       validateLoginRequest,           handleAuth);
app.post("/api/google-auth",    googleAuthRateLimit,                                  handleGoogleAuth);
app.post("/api/set-password",                                                         setAccountPassword);
app.put ("/api/update-password", authenticate,        validateUpdatePasswordRequest,  updatePassword);
app.put ("/api/update-profile",  authenticate,        validateUpdateProfileRequest,   updateProfile);

app.get("/api/auth/profile-stats", authenticate, async (req, res, next) => {
  try {
    const user        = await User.findById(req.user.userId).select("-password");
    const searchCount = await History.countDocuments({ userId: req.user.userId });
    res.json({ success: true, user, stats: { totalSearches: searchCount } });
  } catch (err) { next(err); }
});

// ── Analysis ──────────────────────────────────────────────────────────────────
app.post("/api/analyze", authenticate, analyzeRateLimit, validateCourseAnalysis, analyzeCourse);

// ── History ───────────────────────────────────────────────────────────────────
// NOTE: /all must come BEFORE /:id so Express doesn't try to cast "all" as an ObjectId
app.get   ("/api/history",      authenticate, getHistory);
app.post  ("/api/history",      authenticate, saveSearch);
app.delete("/api/history/all",  authenticate, deleteAllHistory);
app.delete("/api/history/:id",  authenticate, deleteHistoryItem);

// ── Favorites ─────────────────────────────────────────────────────────────────
app.get   ("/api/favorites",         authenticate, getFavorites);
app.post  ("/api/favorites",         authenticate, addFavorite);
app.delete("/api/favorites",         authenticate, removeFavorite);
app.put   ("/api/favorites/:id",     authenticate, updateFavorite);
app.get   ("/api/favorites-check",   authenticate, isFavorited);

// ── Trending / Analytics ──────────────────────────────────────────────────────
app.get("/api/trending-courses",          authenticate, getTrendingCourses);
app.get("/api/analytics/user/:userId",    authenticate, getUserAnalytics);

// ── Admin ─────────────────────────────────────────────────────────────────────
app.get("/api/admin/dashboard", authenticate, getDashboardAnalytics);

// ── Market analysis (public – no auth needed for market overview) ─────────────
app.get("/api/market-analysis", getMarketAnalysis);

// ── Market insights (HuggingFace AI powered) ──────────────────────────────────
// NOTE: More specific routes (/trends, /salary, etc.) must come BEFORE generic (/api/market-insights)
// Disable ETags for dynamic market data to prevent 304 Not Modified issues
app.get("/api/market-insights/all", (req, res) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); }, getCompleteMarketAnalysis);
app.get("/api/market-insights/trends", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getTrendInsights);
app.get("/api/market-insights/salary", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getSalaryInsights);
app.get("/api/market-insights/demand", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getDemandInsights);
app.get("/api/market-insights/sentiment", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getSentimentInsights);
app.get("/api/market-insights/historical", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getHistoricalInsights);
app.get("/api/market-insights", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getMarketInsights);  // Generic route LAST

// ── Course Comparison (HuggingFace AI powered) ────────────────────────────────
app.post("/api/compare-courses", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, compareCourses);
app.get("/api/course-definition/:courseName", (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getCourseDefinition);

// ── Learning Roadmap (HuggingFace AI powered) ─────────────────────────────────
app.get("/api/roadmap", authenticate, (req, res, next) => { res.set("Cache-Control", "no-cache"); res.removeHeader("ETag"); next(); }, getRoadmap);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Connect & listen ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
