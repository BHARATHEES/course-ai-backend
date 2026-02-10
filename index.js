import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import mongoose from "mongoose";

// Import Controllers
import { handleAuth, handleGoogleAuth, setAccountPassword, updatePassword } from "./controllers/AuthController.js";
import { getHistory, saveSearch, deleteHistoryItem, deleteAllHistory } from "./controllers/HistoryController.js";
// Import Models directly for Admin stats
import User from "./models/User.js";
import History from "./models/History.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://bharathees-course-ai.vercel.app" // REPLACE THIS with your actual Vercel URL later
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/courseai";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Connection Failed:", err));

// --- AUTH ROUTES ---
app.post("/api/auth", handleAuth);
app.post("/api/google-auth", handleGoogleAuth);
app.post("/api/set-password", setAccountPassword);
app.put("/api/update-password", updatePassword);

// --- HISTORY ROUTES ---
app.post("/api/history", saveSearch);
app.get("/api/history/:userId", getHistory);
app.delete("/api/history/:id", deleteHistoryItem);
app.delete("/api/history/all/:userId", deleteAllHistory);

// --- NEW: OWNER/ADMIN ROUTES ---

// 1. Get All Users with Search Counts
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({}).lean();

    // Attach history count to each user object
    const usersWithStats = await Promise.all(users.map(async (u) => {
      const count = await History.countDocuments({ userId: u._id });
      return { ...u, historyCount: count };
    }));

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 2. Get Detailed History for a Specific User (Admin View)
app.get("/api/admin/user-history/:userId", async (req, res) => {
  try {
    const history = await History.find({ userId: req.params.userId }).sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user history" });
  }
});

// --- AI GENERATION ROUTE ---
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const validationPrompt = `
      You are a Senior Academic Advisor. Analyze the course: "${prompt}".
      
      Return ONLY a JSON object:
      {
        "isValid": boolean, 
        "analysis": "A comprehensive report using the following structure:
        
        ### 1. Course Overview
        (What is this course about? Define it clearly.)
        
        ### 2. Depth of Complexity
        **Level:** (Choose: Easy, Medium, Hard, or Very Hard)
        **Explanation:** (Why is it at this level? What are the prerequisites?)
        
        ### 3. Practical Applications & Uses
        (How is this applied in the real world? Mention tools or industries.)
        
        ### 4. Future Scope & Trends
        (What is the growth potential in its field for the next 5-10 years?)

        ### 5. Company Demand & Salary Insights
        (Which companies are hiring for skills related to this course? What are the average salaries? list 5 company for freshers and 5 for experienced professionals)

        ### 6. Final Verdict: Is it worth learning?
        (Give a 'Yes/No/Depends' and a summary of the Return on Investment for a student's time.)",
        
        "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]
      }
      
      RULES:
      - Use '\\n' for line breaks between sections.
      - If valid, the analysis must be detailed (approx 300-400 words).
      - If invalid, set isValid to false and suggest 5 related courses."
    `;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: [
            { role: "system", content: "You are a helpful assistant that only communicates in JSON." },
            { role: "user", content: validationPrompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) return res.status(500).json({ error: "AI Error" });

    const data = await response.json();
    res.json(JSON.parse(data.choices[0].message.content));

  } catch (err) {
    res.status(500).json({ error: "Backend Error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`);
});