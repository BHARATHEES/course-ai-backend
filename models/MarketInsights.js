import mongoose from "mongoose";

const marketInsightsSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // Trending metrics
  trends: {
    trendingScore: { type: Number, min: 0, max: 100, default: 50 },
    yoyGrowth: { type: Number, min: 0, max: 100, default: 0 },
    jobTrendDirection: { 
      type: String, 
      enum: ["Growing", "Stable", "Declining"], 
      default: "Stable" 
    }
  },

  // Demand metrics
  demand: {
    demandScore: { type: Number, min: 0, max: 100, default: 50 },
    openPositions: { type: Number, default: 0 },
    futureOutlook6Months: { 
      type: String, 
      enum: ["High", "Medium", "Low"], 
      default: "Medium" 
    }
  },

  // Salary info (in INR - for India focus)
  salary: {
    averageBeginnerINR: { type: Number, default: 500000 },
    averageExperiencedINR: { type: Number, default: 1200000 },
    salaryGrowthPercent: { type: Number, min: 0, max: 100, default: 10 }
  },

  // Top companies hiring
  topCompanies: [{
    type: String,
    _id: false
  }],

  // Top industries
  topIndustries: [{
    type: String,
    _id: false
  }],

  // Related skills
  relatedSkills: [{
    type: String,
    _id: false
  }],

  // Geographical distribution (percentages)
  geographicalDistribution: {
    india: { type: Number, min: 0, max: 100, default: 20 },
    northAmerica: { type: Number, min: 0, max: 100, default: 35 },
    europe: { type: Number, min: 0, max: 100, default: 20 },
    asiaPacific: { type: Number, min: 0, max: 100, default: 15 },
    other: { type: Number, min: 0, max: 100, default: 10 }
  },

  // Job role distribution (percentages)
  jobRoleDistribution: {
    entrylevel: { type: Number, min: 0, max: 100, default: 30 },
    midLevel: { type: Number, min: 0, max: 100, default: 45 },
    seniorLevel: { type: Number, min: 0, max: 100, default: 20 },
    leadership: { type: Number, min: 0, max: 100, default: 5 }
  },

  // ML Predictions (all 0-100 scale)
  mlPredictions: {
    predictedDemand6Months: { type: Number, min: 0, max: 100, default: 60 },
    recommendationScore: { type: Number, min: 0, max: 100, default: 70 },
    deprecationRisk: { type: Number, min: 0, max: 100, default: 20 },
    careerPathAlignment: { type: Number, min: 0, max: 100, default: 75 }
  },

  // Community sentiment
  communitySentiment: {
    overallSentiment: { 
      type: String, 
      enum: ["Positive", "Neutral", "Negative"], 
      default: "Positive" 
    },
    sentimentScore: { type: Number, min: 0, max: 100, default: 75 },
    communityEngagement: { type: Number, min: 0, max: 100, default: 70 }
  },

  // Historical growth data (last 5 years)
  historicalGrowth: {
    year1: { 
      year: { type: Number, default: () => new Date().getFullYear() - 4 },
      demandScore: { type: Number, min: 0, max: 100, default: 50 },
      salaryINR: { type: Number, default: 400000 },
      openPositions: { type: Number, default: 2000 },
      trendingScore: { type: Number, min: 0, max: 100, default: 40 }
    },
    year2: { 
      year: { type: Number, default: () => new Date().getFullYear() - 3 },
      demandScore: { type: Number, min: 0, max: 100, default: 55 },
      salaryINR: { type: Number, default: 480000 },
      openPositions: { type: Number, default: 3500 },
      trendingScore: { type: Number, min: 0, max: 100, default: 45 }
    },
    year3: { 
      year: { type: Number, default: () => new Date().getFullYear() - 2 },
      demandScore: { type: Number, min: 0, max: 100, default: 65 },
      salaryINR: { type: Number, default: 600000 },
      openPositions: { type: Number, default: 5500 },
      trendingScore: { type: Number, min: 0, max: 100, default: 55 }
    },
    year4: { 
      year: { type: Number, default: () => new Date().getFullYear() - 1 },
      demandScore: { type: Number, min: 0, max: 100, default: 75 },
      salaryINR: { type: Number, default: 750000 },
      openPositions: { type: Number, default: 8000 },
      trendingScore: { type: Number, min: 0, max: 100, default: 70 }
    },
    year5: { 
      year: { type: Number, default: () => new Date().getFullYear() },
      demandScore: { type: Number, min: 0, max: 100, default: 85 },
      salaryINR: { type: Number, default: 900000 },
      openPositions: { type: Number, default: 10822 },
      trendingScore: { type: Number, min: 0, max: 100, default: 85 }
    }
  },

  // Growth percentages
  growthMetrics: {
    demandGrowth5Year: { type: Number, default: 70 },  // % increase
    salaryGrowth5Year: { type: Number, default: 125 },  // % increase
    jobsGrowth5Year: { type: Number, default: 440 },    // % increase
    trendingGrowth5Year: { type: Number, default: 112 }  // % increase
  },

  // Metadata
  lastUpdated: { type: Date, default: Date.now, index: true },
  dataSource: { type: String, default: "HuggingFace AI" },
  aiModel: { type: String, default: "Mistral-7B-Instruct" },
  confidenceScore: { type: Number, min: 0, max: 100, default: 85 }
}, {
  timestamps: true
});

// Index for efficient queries
marketInsightsSchema.index({ courseName: 1, lastUpdated: -1 });

const MarketInsights = mongoose.model("MarketInsights", marketInsightsSchema);

export default MarketInsights;
