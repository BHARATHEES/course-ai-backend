import RoadmapService from "../services/roadmapService.js";
import AppError from "../utils/AppError.js";

// ── Validation helper ──────────────────────────────────────────────────────
const validateCourseName = (courseName) => {
  if (!courseName || typeof courseName !== 'string') {
    return { valid: false, error: "courseName is required and must be a string" };
  }
  if (courseName.length > 100) {
    return { valid: false, error: "courseName must not exceed 100 characters" };
  }
  if (!/^[a-zA-Z0-9\s\-_.+&()]*$/.test(courseName)) {
    return { valid: false, error: "courseName contains invalid characters" };
  }
  return { valid: true };
};

/**
 * GET /api/roadmap
 * Generate a learning roadmap for a course
 * Query: ?courseName=CourseNameHere
 * Only available for favorited courses
 */
export const getRoadmap = async (req, res, next) => {
  try {
    const { courseName } = req.query;

    // Validate courseName
    const validation = validateCourseName(courseName);
    if (!validation.valid) {
      return next(new AppError(validation.error, 400));
    }

    // Generate roadmap
    const roadmap = await RoadmapService.generateLearningRoadmap(courseName.trim());

    // Return roadmap
    res.json({
      success: true,
      message: "Learning roadmap generated successfully",
      data: roadmap,
    });
  } catch (error) {
    console.error("❌ Roadmap generation error:", error.message);
    next(new AppError(error.message || "Failed to generate roadmap", 500));
  }
};
