import History from "../models/History.js";

// Save a search
export const saveSearch = async (req, res) => {
  console.log("📥 History POST Request:", req.body);
  const { userId, searchQuery } = req.body;

  if (!userId || !searchQuery) {
    console.warn("⚠️ Save blocked: userId or searchQuery is missing.");
    return res.status(400).json({ error: "userId and searchQuery are required" });
  }

  try {
    const newEntry = new History({ userId, searchQuery });
    await newEntry.save();
    console.log("✅ History saved to MongoDB:", searchQuery);
    res.status(201).json(newEntry);
  } catch (err) {
    console.error("❌ MongoDB Save Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get user history
export const getHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const history = await History.find({ userId }).sort({ timestamp: -1 });
    res.status(200).json(history);
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/** * NEW: Delete a single history item 
 */
export const deleteHistoryItem = async (req, res) => {
  const { id } = req.params; // The MongoDB _id of the history entry entry
  console.log("🗑️ Deleting history item:", id);

  try {
    const result = await History.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "History item not found" });
    }
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/** * NEW: Clear entire history for a specific user
 */
export const deleteAllHistory = async (req, res) => {
  const { userId } = req.params;
  
  // Validation: Ensure userId is not empty to avoid accidental global deletion
  if (!userId || userId === "undefined") {
    return res.status(400).json({ error: "User ID is required for clearing history" });
  }

  console.log("🧹 Clearing all history for User:", userId);

  try {
    const result = await History.deleteMany({ userId });
    res.status(200).json({ 
      message: "All history cleared", 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error("❌ Clear All Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};