import CourseCache from "../models/CourseCache.js";

/**
 * Cache Service for Course Analyses
 * 
 * Reduces AI API costs by:
 * 1. Checking cache before making expensive AI calls
 * 2. Storing successful analyses for 7 days
 * 3. Tracking cache hit rates for optimization
 * 
 * Cache hits save money on AI API calls (~$0.005 per analysis)
 */

/**
 * Get cached analysis for a course
 * 
 * @param {string} courseName - The course to look up
 * @returns {Promise<object|null>} - Cached analysis or null if not found
 * 
 * @example
 * const cached = await getCachedAnalysis("Python");
 * if (cached) {
 *   return res.json({ ...cached, source: "cache", isCached: true });
 * }
 */
export const getCachedAnalysis = async (courseName) => {
  try {
    if (!courseName) {
      return null;
    }

    const normalized = courseName.trim().toLowerCase();

    // Look up in cache
    const cached = await CourseCache.findOne({ courseName: normalized });

    if (cached) {
      // Increment hit count for analytics
      await incrementHitCount(normalized);
      
      console.log(`✅ Cache HIT for "${courseName}" (${cached.hitCount + 1} uses)`);
      
      return cached.analysisResult;
    }

    console.log(`⚠️ Cache MISS for "${courseName}" - will call AI service`);
    return null;

  } catch (err) {
    console.error("❌ Cache lookup error:", err.message);
    // If cache lookup fails, continue without cache
    return null;
  }
};

/**
 * Store analysis in cache
 * 
 * @param {string} courseName - The course name
 * @param {object} analysisResult - The analysis from AI service
 * @returns {Promise<object>} - Saved cache entry
 * 
 * @example
 * const analysis = await aiService.analyzeCourse("Python");
 * await setCachedAnalysis("Python", analysis);
 */
export const setCachedAnalysis = async (courseName, analysisResult) => {
  try {
    if (!courseName || !analysisResult) {
      console.warn("⚠️ Cannot cache: missing courseName or analysisResult");
      return null;
    }

    const normalized = courseName.trim().toLowerCase();

    // Check if already exists
    let cached = await CourseCache.findOne({ courseName: normalized });

    if (cached) {
      // Update existing cache entry
      cached.analysisResult = analysisResult;
      cached.updatedAt = Date.now();
      await cached.save();
      console.log(`📝 Updated cache for "${courseName}"`);
    } else {
      // Create new cache entry
      cached = await CourseCache.create({
        courseName: normalized,
        analysisResult,
        hitCount: 0
      });
      console.log(`💾 Cached new analysis for "${courseName}"`);
    }

    return cached;

  } catch (err) {
    // Don't fail the request if caching fails
    console.error("❌ Cache storage error:", err.message);
    return null;
  }
};

/**
 * Increment cache hit count
 * Internal function for tracking cache effectiveness
 * 
 * @param {string} courseName - Normalized course name
 * @returns {Promise<void>}
 */
const incrementHitCount = async (courseName) => {
  try {
    await CourseCache.findOneAndUpdate(
      { courseName: courseName.toLowerCase() },
      { $inc: { hitCount: 1 }, updatedAt: Date.now() },
      { new: true }
    );
  } catch (err) {
    // Silently fail - don't interrupt request if hit count update fails
    console.error("⚠️ Failed to update cache hit count:", err.message);
  }
};

/**
 * Get cache statistics
 * Useful for monitoring cache effectiveness
 * 
 * @returns {Promise<object>} - Cache stats
 * 
 * @example
 * const stats = await getCacheStats();
 * console.log(`Total cached analyses: ${stats.totalEntries}`);
 * console.log(`Cache hit savings: ${stats.totalHits} API calls avoided`);
 */
export const getCacheStats = async () => {
  try {
    const totalEntries = await CourseCache.countDocuments();
    const totalHits = await CourseCache.aggregate([
      {
        $group: {
          _id: null,
          totalHits: { $sum: "$hitCount" }
        }
      }
    ]);

    const topCourses = await CourseCache.find()
      .sort({ hitCount: -1 })
      .limit(5)
      .select("courseName hitCount createdAt");

    return {
      totalEntries,
      totalHits: totalHits[0]?.totalHits || 0,
      topCourses,
      costSavings: {
        apiCallsAvoided: totalHits[0]?.totalHits || 0,
        estimatedSavings: `$${((totalHits[0]?.totalHits || 0) * 0.005).toFixed(2)}` // Rough estimate
      }
    };

  } catch (err) {
    console.error("❌ Error fetching cache stats:", err.message);
    return null;
  }
};

/**
 * Clear all cache entries
 * Use with caution - typically not needed due to TTL
 * 
 * @returns {Promise<object>} - Deletion result
 * 
 * @example
 * const result = await clearAllCache();
 * console.log(`Deleted ${result.deletedCount} cache entries`);
 */
export const clearAllCache = async () => {
  try {
    const result = await CourseCache.deleteMany({});
    console.log(`🧹 Cleared ${result.deletedCount} cache entries`);
    return result;
  } catch (err) {
    console.error("❌ Error clearing cache:", err.message);
    return null;
  }
};

/**
 * Clear specific cache entry
 * 
 * @param {string} courseName - Course name to remove from cache
 * @returns {Promise<object|null>} - Deleted entry or null
 * 
 * @example
 * await clearCacheEntry("Python");
 */
export const clearCacheEntry = async (courseName) => {
  try {
    if (!courseName) return null;

    const normalized = courseName.trim().toLowerCase();
    const result = await CourseCache.findOneAndDelete({ courseName: normalized });
    
    if (result) {
      console.log(`🗑️ Removed "${courseName}" from cache`);
    }
    
    return result;

  } catch (err) {
    console.error("❌ Error clearing cache entry:", err.message);
    return null;
  }
};
