import DataAggregationService from "../services/dataAggregationService.js";
import NLPService              from "../services/nlpService.js";
import MarketData              from "../models/MarketData.js";
import MarketInsights          from "../models/MarketInsights.js";
import HuggingFaceMarketInsightsService from "../services/huggingFaceMarketInsightsService.js";
import { asyncHandler }        from "../middleware/errorHandler.js";

// ── Validation helper ──────────────────────────────────────────────────────
const validateCourseName = (courseName) => {
  if (!courseName || typeof courseName !== 'string') {
    return { valid: false, error: "courseName is required and must be a string" };
  }
  if (courseName.length > 100) {
    return { valid: false, error: "courseName must not exceed 100 characters" };
  }
  if (!/^[a-zA-Z0-9\s\-_.+&()]*$/.test(courseName)) {
    return { valid: false, error: "courseName contains invalid characters" };
  }
  return { valid: true };
};

/** GET /api/market-analysis?courseName=... */
export const getMarketAnalysis = asyncHandler(async (req, res) => {
  const { courseName } = req.query;
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error });

  const marketData = await DataAggregationService.aggregateMarketData(courseName);
  const insights   = NLPService.generateInsights(marketData);

  res.json({ success: true, courseName, marketData, insights, timestamp: new Date() });
});

/** GET /api/market-analysis/composition?courseName=... */
export const getMarketComposition = asyncHandler(async (req, res) => {
  const { courseName } = req.query;
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error });

  let data = await MarketData.findOne({ courseName: courseName.toLowerCase() });
  if (!data) {
    await DataAggregationService.aggregateMarketData(courseName);
    data = await MarketData.findOne({ courseName: courseName.toLowerCase() });
  }

  res.json({ success: true, courseName, marketComposition: data?.marketComposition });
});

/** GET /api/market-analysis/trending?limit=10 */
export const getTrendingMarket = asyncHandler(async (req, res) => {
  const limit   = parseInt(req.query.limit) || 10;
  const courses = await DataAggregationService.getTrendingCourses(limit);
  res.json({ success: true, trendingCourses: courses, count: courses.length });
});

/**
 * GET /api/market-insights?courseName=...
 * Get HuggingFace AI-powered market insights for a course
 * Priority: Database Cache → HuggingFace API → Cached Data
 */
export const getMarketInsights = asyncHandler(async (req, res) => {
  const { courseName } = req.query;
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error });

  try {
    const insights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
    
    res.json({ 
      success: true,
      courseName,
      marketData: insights,
      timestamp: new Date(),
      dataSource: insights.dataSource || "HuggingFace AI",
      lastUpdated: insights.lastUpdated
    });
  } catch (error) {
    console.error(`❌ Error fetching market insights:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      courseName
    });
  }
});

/**
 * GET /api/market-insights/all?courseName=...
 * Get all market analysis data including HuggingFace + external APIs
 */
export const getCompleteMarketAnalysis = asyncHandler(async (req, res) => {
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error
  if (!courseName) return res.status(400).json({ success: false, error: "courseName is required" });

  // Get market insights from HuggingFace
  const insights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
  
  // Get legacy market data (for backward compatibility)
  let legacyData = await MarketData.findOne({ courseName: courseName.toLowerCase() });
  if (!legacyData) {
    await DataAggregationService.aggregateMarketData(courseName);
    legacyData = await MarketData.findOne({ courseName: courseName.toLowerCase() });
  }

  res.json({
    success: true,
    courseName,
    huggingfaceInsights: insights,
    legacyMarketData: legacyData,
    timestamp: new Date()
  });
});

/**
 * GET /api/market-insights/trends?courseName=...
 * Get trend-specific insights
 */
export const getTrendInsights = asyncHandler(async (req, res) => {
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error
  if (!courseName) return res.status(400).json({ success: false, error: "courseName is required" });

  const insights = await MarketInsights.findOne({ courseName: courseName.toLowerCase() });
  
  if (!insights) {
    const newInsights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
    return res.json({
      success: true,
      courseName,
      trends: newInsights.trends,
      mlPredictions: newInsights.mlPredictions
    });
  }

  res.json({
    success: true,
    courseName,
    trends: insights.trends,
    mlPredictions: insights.mlPredictions,
    lastUpdated: insights.lastUpdated
  });
});

/**
 * GET /api/market-insights/salary?courseName=...
 * Get salary and compensation insights
 */
export const getSalaryInsights = asyncHandler(async (req, res) => {
  const { courseName } = req.query;
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error });

  const insights = await MarketInsights.findOne({ courseName: courseName.toLowerCase() });
  
  if (!insights) {
    const newInsights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
    return res.json({
      success: true,
      courseName,
      salary: newInsights.salary,
      topCompanies: newInsights.topCompanies
    });
  }

  res.json({
    success: true,
    courseName,
    salary: insights.salary,
    topCompanies: insights.topCompanies,
    topIndustries: insights.topIndustries
  });
});

/**
 * GET /api/market-insights/demand?courseName=...
 * Get demand and job market insights
 */
export const getDemandInsights = asyncHandler(async (req, res) => {
  const { courseName } = req.query;
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error });

  const insights = await MarketInsights.findOne({ courseName: courseName.toLowerCase() });
  
  if (!insights) {
    const newInsights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
    return res.json({
      success: true,
      courseName,
      demand: newInsights.demand,
      jobRoleDistribution: newInsights.jobRoleDistribution,
      geographicalDistribution: newInsights.geographicalDistribution
    });
  }

  res.json({
    success: true,
    courseName,
    demand: insights.demand,
    jobRoleDistribution: insights.jobRoleDistribution,
    geographicalDistribution: insights.geographicalDistribution,
    relatedSkills: insights.relatedSkills
  });
});

/**
 * GET /api/market-insights/sentiment?courseName=...
 * Get community sentiment and engagement metrics
 */
export const getSentimentInsights = asyncHandler(async (req, res) => {
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error
  if (!courseName) return res.status(400).json({ success: false, error: "courseName is required" });

  const insights = await MarketInsights.findOne({ courseName: courseName.toLowerCase() });
  
  if (!insights) {
    const newInsights = await HuggingFaceMarketInsightsService.generateMarketInsights(courseName);
    return res.json({
      success: true,
      courseName,
      communitySentiment: newInsights.communitySentiment
    });
  }

  res.json({
    success: true,
    courseName,
    communitySentiment: insights.communitySentiment
  });
});

/**
 * GET /api/market-insights/historical?courseName=...
 * Get 5-year historical growth data and trends
 */
export const getHistoricalInsights = asyncHandler(async (req, res) => {
  const validation = validateCourseName(courseName);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.error
  if (!courseName) return res.status(400).json({ success: false, error: "courseName is required" });

  try {
    // Only fetch from database, don't generate new data if missing
    const insights = await MarketInsights.findOne({ courseName: courseName.toLowerCase() });
    
    if (!insights) {
      return res.status(200).json({
        success: false,
        courseName,
        message: "Historical growth data not yet available for this course.",
        historicalGrowth: null,
        growthMetrics: null
      });
    }

    res.json({
      success: true,
      courseName,
      historicalGrowth: insights.historicalGrowth,
      growthMetrics: insights.growthMetrics,
      currentMetrics: {
        demandScore: insights.demand?.demandScore || null,
        salaryINR: insights.salary?.averageExperiencedINR || null,
        openPositions: insights.demand?.openPositions || null,
        trendingScore: insights.trends?.trendingScore || null
      },
      lastUpdated: insights.lastUpdated,
      dataSource: insights.dataSource
    });
  } catch (error) {
    console.error(`❌ Error fetching historical insights:`, error.message);
    res.status(500).json({ success: false, error: "Error fetching historical data" });
  }
});
