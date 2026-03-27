import mongoose from "mongoose";

const courseCacheSchema = new mongoose.Schema({
  /**
   * Course Name (normalized for consistent lookups)
   * Lowercase for case-insensitive matches
   */
  courseName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // Index for fast lookups
  },

  /**
   * Cached Analysis Result
   * Stores the complete analysis object from AI service:
   * - popularityScore
   * - marketDemand
   * - salaryPotential
   * - learningDifficulty
   * - summary
   * - jobOpportunities
   * - requiredSkills
   * - trendingScore
   * - estimatedLearningTime
   * - lastUpdated
   */
  analysisResult: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  /**
   * Cache Hit Count
   * Track how many times this cache entry was used
   * Useful for analytics and determining popular course analyses
   */
  hitCount: {
    type: Number,
    default: 0
  },

  /**
   * Creation Timestamp
   * When the analysis was cached
   */
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL Index: Automatically delete cache entries after 7 days
    // This prevents stale data while keeping storage usage manageable
    index: { expireAfterSeconds: 7 * 24 * 60 * 60 } // 7 days
  },

  /**
   * Last Update Timestamp
   * When the cache entry was last accessed/updated
   */
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Middleware: Update updatedAt on any modification
 */
courseCacheSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Middleware: Update updatedAt on findByIdAndUpdate
 */
courseCacheSchema.pre("findByIdAndUpdate", function () {
  this.set({ updatedAt: Date.now() });
});

export default mongoose.model("CourseCache", courseCacheSchema);
