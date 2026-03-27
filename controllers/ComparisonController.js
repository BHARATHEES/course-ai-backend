import CourseComparisonService from "../services/courseComparisonService.js";

// ── Validation helper ──────────────────────────────────────────────────────
const validateCourseName = (courseName) => {
  if (!courseName || typeof courseName !== 'string') {
    return false;
  }
  if (courseName.length > 100) {
    return false;
  }
  if (!/^[a-zA-Z0-9\s\-_.+&()]*$/.test(courseName)) {
    return false;
  }
  return true;
};

/**
 * Course Comparison Controller
 * Handles API requests for comparing multiple courses
 */

export const compareCourses = async (req, res) => {
  try {
    const { courses } = req.body;

    // Validate input
    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({
        success: false,
        error: "Invalid input. 'courses' array is required"
      });
    }

    if (courses.length < 2 || courses.length > 5) {
      return res.status(400).json({
        success: false,
        error: "Please provide 2-5 courses to compare"
      });
    }

    // Validate course names
    const validCourses = courses.filter(c => 
      typeof c === "string" && 
      c.trim().length > 0 && 
      validateCourseName(c.trim())
    );
    
    if (validCourses.length !== courses.length) {
      return res.status(400).json({
        success: false,
        error: "All courses must be valid names (alphanumeric, spaces, hyphens, underscores, max 100 chars)"
      });
    }

    console.log(`📊 API: Comparing courses: ${validCourses.join(", ")}`);

    // Perform comparison
    const result = await CourseComparisonService.compareCourses(validCourses);

    res.status(200).json({
      success: true,
      data: result,
      message: `Successfully compared ${validCourses.length} courses`
    });
  } catch (error) {
    console.error(`❌ Comparison API error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to compare courses"
    });
  }
};

export const getCourseDefinition = async (req, res) => {
  try {
    const { courseName } = req.params;

    if (!courseName || courseName.trim().length === 0 || !validateCourseName(courseName.trim())) {
      return res.status(400).json({
        success: false,
        error: "Course name is invalid (alphanumeric, spaces, hyphens, underscores, max 100 chars)"
      });
    }

    console.log(`📚 API: Getting definition for: ${courseName}`);

    // Get comparison data (includes definitions)
    const result = await CourseComparisonService.compareCourses([courseName]);

    res.status(200).json({
      success: true,
      courseName: courseName.toLowerCase(),
      definition: result.comparison?.courses?.[courseName.toLowerCase()] || null,
      insights: result.insights?.[courseName.toLowerCase()] || null
    });
  } catch (error) {
    console.error(`❌ Definition API error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get course definition"
    });
  }
};

export default { compareCourses, getCourseDefinition };
