import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  // Changed from ObjectId to String to prevent strict validation errors
  // but kept the 'ref' so you can still use .populate() if needed later.
  userId: {
    type: String,
    ref: 'User',
    required: true,
    index: true // Adding an index makes fetching user history much faster
  },
  searchQuery: {
    type: String,
    required: true,
    trim: true // Removes accidental whitespace
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("History", historySchema);