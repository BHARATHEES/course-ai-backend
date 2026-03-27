/**
 * Seed historical market insights data into MongoDB
 * Run: node scripts/seedHistoricalData.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import MarketInsights from "../models/MarketInsights.js";
import HuggingFaceMarketInsightsService from "../services/huggingFaceMarketInsightsService.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Sample courses to seed
const SAMPLE_COURSES = [
  "Python",
  "JavaScript",
  "React",
  "Machine Learning",
  "Data Science",
  "TypeScript",
  "Node.js",
  "AWS",
  "Docker",
  "Kubernetes"
];

async function seedData() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Seed each course
    console.log(`\n📊 Seeding ${SAMPLE_COURSES.length} courses with historical data...\n`);

    for (const courseName of SAMPLE_COURSES) {
      try {
        console.log(`⏳ Processing: ${courseName}...`);
        
        // Check if data already exists
        let existing = await MarketInsights.findOne({ 
          courseName: courseName.toLowerCase() 
        });

        if (existing) {
          console.log(`   ✅ ${courseName} - Already in database (skipping)`);
          continue;
        }

        // Generate insights using HuggingFace AI
        const insights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
        
        console.log(`   ✅ ${courseName} - Generated and saved`);
        console.log(`      - Trending Score: ${insights.trends?.trendingScore || 0}/100`);
        console.log(`      - Demand Score: ${insights.demand?.demandScore || 0}/100`);
        console.log(`      - 5-Year Demand Growth: ${insights.growthMetrics?.demandGrowth5Year || 0}%`);
        console.log(`      - 5-Year Salary Growth: ${insights.growthMetrics?.salaryGrowth5Year || 0}%\n`);

      } catch (error) {
        console.error(`   ❌ ${courseName} - Error: ${error.message}`);
      }
    }

    console.log("\n✅ Seeding completed!");
    console.log("\nYou can now search for these courses in the Market Insights page to see historical data.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedData();
