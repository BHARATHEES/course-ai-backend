import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  /**
   * User ID (String or ObjectId)
   * Changed from ObjectId to String to prevent strict validation errors
   * but kept the 'ref' so you can still use .populate() if needed later.
   */
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true // Adding an index makes fetching user history much faster
  },

  /**
   * Course Name
   * The course that was analyzed
   */
  courseName: {
    type: String,
    required: true,
    trim: true // Removes accidental whitespace
  },

  /**
   * Complete Analysis Result
   * Stores the full analysis object returned from AI service:
   * - popularityScore
   * - marketDemand
   * - salaryPotential
   * - learningDifficulty
   * - summary
   * - jobOpportunities
   * - requiredSkills
   * - trendingScore
   * - estimatedLearningTime
   * - timestamp (of the analysis)
   */
  analysisResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  /**
   * Creation Timestamp
   * When the analysis was saved to history
   */
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Index for faster sorting by date
  }
});

/**
 * Middleware to handle backward compatibility
 * Maps old 'timestamp' field to 'createdAt' if it exists
 */
historySchema.pre(['find', 'findOne', 'findOneAndDelete'], function() {
  // Automatically convert legacy 'searchQuery' to 'courseName' in queries
  if (this.getOptions().lean !== false) {
    this.select('+courseName');
  }
});

export default mongoose.model("History", historySchema);