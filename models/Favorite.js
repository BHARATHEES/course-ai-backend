import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  analysisResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
});

// Ensure unique constraint on userId + courseName
favoriteSchema.index({ userId: 1, courseName: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
