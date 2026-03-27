import mongoose from "mongoose";

const marketDataSchema = new mongoose.Schema({
  courseName: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Popularity metrics
  popularity: {
    enrollmentCount: { type: Number, default: 0 },
    trendScore: { type: Number, default: 0, min: 0, max: 100 }, // Growth trend 0-100
    monthlySearchVolume: { type: Number, default: 0 },
    courseRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 }
  },
  
  // Difficulty assessment
  difficulty: {
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert"], default: "Beginner" },
    averageScore: { type: Number, default: 0, min: 0, max: 100 }, // Avg completion score
    completionRate: { type: Number, default: 0, min: 0, max: 100 }, // % of students who finish
    estimatedHours: { type: Number, default: 0 } // Hours to complete
  },
  
  // Salary insights
  salary: {
    averageStarting: { type: Number, default: 0 }, // USD per year
    averageExperienced: { type: Number, default: 0 }, // USD per year
    salaryGrowthPercent: { type: Number, default: 0 }, // Expected growth %
    companiesOfferingPremium: [String] // Top companies paying well
  },
  
  // Job market demand
  demand: {
    openPositions: { type: Number, default: 0 }, // Active job postings
    demandScore: { type: Number, default: 0, min: 0, max: 100 }, // Overall market demand
    yoyGrowth: { type: Number, default: 0 }, // Year-over-year growth %
    skillFrequencyInJobs: { type: Number, default: 0, min: 0, max: 100 }, // % of jobs requiring this skill
    topIndustries: [String] // Industries hiring most
  },
  
  // Market composition (for pie charts)
  marketComposition: {
    byRegion: { // Geographic distribution
      northAmerica: { type: Number, default: 0 },
      europe: { type: Number, default: 0 },
      asia: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    byDifficulty: { // Student distribution by difficulty
      beginnerStudents: { type: Number, default: 0 },
      intermediateStudents: { type: Number, default: 0 },
      advancedStudents: { type: Number, default: 0 }
    },
    byJobRole: { // Job roles hiring for this skill
      dataScientist: { type: Number, default: 0 },
      softwareEngineer: { type: Number, default: 0 },
      dataAnalyst: { type: Number, default: 0 },
      machineLearningEngineer: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  
  // NLP sentiment analysis
  sentimentAnalysis: {
    overallSentiment: { type: String, enum: ["Very Positive", "Positive", "Neutral", "Negative"], default: "Neutral" },
    sentimentScore: { type: Number, default: 0, min: -1, max: 1 }, // -1 to 1
    positiveMentions: { type: Number, default: 0 },
    negativeMentions: { type: Number, default: 0 },
    keyPhrases: [String], // Top positive/negative phrases
    reviewSummary: { type: String, default: "" }
  },
  
  // Real-time trending data
  trends: {
    isRising: { type: Boolean, default: false },
    peakSearchMonth: { type: String, default: "" },
    relatedSkills: [String], // Skills often learned together
    alternativeSkills: [String] // Skills that compete for similar roles
  },
  
  // ML Insights
  mlInsights: {
    predictedDemandNext6Months: { type: Number, default: 0, min: 0, max: 100 }, // ML predicted score
    recommendationScore: { type: Number, default: 0, min: 0, max: 100 }, // Worth learning score
    skillDeprecationRisk: { type: Number, default: 0, min: 0, max: 100 }, // Risk of becoming obsolete
    careerpathAlignment: [{ // Best career paths for this skill
      path: String,
      alignment: Number // 0-100 score
    }]
  },
  
  // Metadata
  dataSource: [String], // Which sources provided this data
  lastUpdated: { type: Date, default: Date.now },
  updateFrequency: { type: String, default: "weekly" }, // How often data is refreshed
  confidenceScore: { type: Number, default: 0, min: 0, max: 100 }, // Data accuracy confidence
  
  // Historical tracking for trends
  historicalData: [{
    date: { type: Date, default: Date.now },
    enrollmentCount: Number,
    openPositions: Number,
    averageSalary: Number,
    demandScore: Number
  }]
  
}, { timestamps: true });

// Index for frequently queried fields
marketDataSchema.index({ "demand.demandScore": -1 });
marketDataSchema.index({ "popularity.trendScore": -1 });
marketDataSchema.index({ createdAt: -1 });

export default mongoose.model("MarketData", marketDataSchema);
