import History     from "../models/History.js";
import Favorite    from "../models/Favorite.js";
import User        from "../models/User.js";
import CourseCache from "../models/CourseCache.js";
import AppError    from "../utils/AppError.js";

// ─── In-process trending cache (1-hour TTL) ───────────────────────────────────
const _cache  = {};
const TTL_MS  = 60 * 60 * 1000;

const cacheGet = (key) => {
  const entry = _cache[key];
  if (entry && Date.now() - entry.ts < TTL_MS) return entry.data;
  delete _cache[key];
  return null;
};

const cacheSet = (key, data) => { _cache[key] = { data, ts: Date.now() }; };

/** Called by AnalysisController after a new analysis is saved. */
export const clearTrendingCache = () => {
  let n = 0;
  for (const k of Object.keys(_cache)) { if (k.startsWith("trending_")) { delete _cache[k]; n++; } }
  if (n) console.log(`🗑️  Cleared ${n} trending cache entries`);
};

// ─── Difficulty / rating lookup ───────────────────────────────────────────────
const META = {
  python:               { difficulty: "Intermediate", rating: 4.7 },
  "machine learning":   { difficulty: "Advanced",     rating: 4.8 },
  "web development":    { difficulty: "Intermediate", rating: 4.6 },
  "data science":       { difficulty: "Advanced",     rating: 4.9 },
  react:                { difficulty: "Intermediate", rating: 4.7 },
  aws:                  { difficulty: "Advanced",     rating: 4.5 },
  java:                 { difficulty: "Intermediate", rating: 4.6 },
  javascript:           { difficulty: "Beginner",     rating: 4.8 },
  "artificial intelligence": { difficulty: "Advanced", rating: 4.9 },
  "cloud computing":    { difficulty: "Intermediate", rating: 4.7 },
  devops:               { difficulty: "Advanced",     rating: 4.6 },
  docker:               { difficulty: "Intermediate", rating: 4.5 },
  kubernetes:           { difficulty: "Advanced",     rating: 4.7 },
  sql:                  { difficulty: "Beginner",     rating: 4.5 },
  "node.js":            { difficulty: "Intermediate", rating: 4.6 },
};

const getMeta = (name) =>
  META[name.toLowerCase()] || { difficulty: "Intermediate", rating: 4.5 };

// ─── GET /api/trending-courses ────────────────────────────────────────────────
export const getTrendingCourses = async (req, res, next) => {
  try {
    const days      = parseInt(req.query.days)  || 30;
    const page      = parseInt(req.query.page)  || 1;
    const limit     = parseInt(req.query.limit) || 20;
    const sortBy    = req.query.sortBy || "searches";
    const skipCache = req.query.skipCache === "true";
    const skip      = (page - 1) * limit;

    const cacheKey = `trending_${days}_${sortBy}`;
    let enriched   = skipCache ? null : cacheGet(cacheKey);

    if (!enriched) {
      const since    = new Date(Date.now() - days * 86400000);
      const prevFrom = new Date(Date.now() - days * 2 * 86400000);

      // Current period
      const current = await History.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $toLower: "$courseName" }, count: { $sum: 1 }, last: { $max: "$createdAt" }, orig: { $first: "$courseName" } } },
      ]);

      // Previous period (for growth %)
      const prevMap = {};
      (await History.aggregate([
        { $match: { createdAt: { $gte: prevFrom, $lt: since } } },
        { $group: { _id: { $toLower: "$courseName" }, count: { $sum: 1 } } },
      ])).forEach((x) => { prevMap[x._id] = x.count; });

      enriched = current.map((item) => {
        const prev   = prevMap[item._id] || 0;
        const growth = prev > 0 ? +((item.count - prev) / prev * 100).toFixed(1) : (item.count > 0 ? 100 : 0);
        const meta   = getMeta(item._id);
        return {
          courseName:      item.orig,
          searchCount:     item.count,
          previousCount:   prev,
          growthPercent:   growth,
          growthDirection: growth > 0 ? "up" : growth < 0 ? "down" : "stable",
          lastSearched:    item.last,
          ...meta,
        };
      });

      // Sort
      if      (sortBy === "name") enriched.sort((a, b) => a.courseName.localeCompare(b.courseName));
      else if (sortBy === "date") enriched.sort((a, b) => new Date(b.lastSearched) - new Date(a.lastSearched));
      else                        enriched.sort((a, b) => b.searchCount - a.searchCount);

      if (enriched.length) cacheSet(cacheKey, enriched);
    }

    // No real data → sample
    if (!enriched.length) {
      const sample = [
        { courseName: "Machine Learning", searchCount: 245, previousCount: 215, growthPercent: 13.9, growthDirection: "up", difficulty: "Advanced",     rating: 4.8, lastSearched: new Date(), rank: 1 },
        { courseName: "Python",           searchCount: 198, previousCount: 185, growthPercent: 7.0,  growthDirection: "up", difficulty: "Intermediate", rating: 4.7, lastSearched: new Date(Date.now() - 86400000), rank: 2 },
        { courseName: "Web Development",  searchCount: 167, previousCount: 172, growthPercent: -2.9, growthDirection: "down", difficulty: "Intermediate", rating: 4.6, lastSearched: new Date(Date.now() - 172800000), rank: 3 },
        { courseName: "Data Science",     searchCount: 156, previousCount: 140, growthPercent: 11.4, growthDirection: "up", difficulty: "Advanced",     rating: 4.9, lastSearched: new Date(Date.now() - 259200000), rank: 4 },
        { courseName: "React",            searchCount: 142, previousCount: 155, growthPercent: -8.4, growthDirection: "down", difficulty: "Intermediate", rating: 4.7, lastSearched: new Date(Date.now() - 345600000), rank: 5 },
      ];
      return res.json({ success: true, isSampleData: true, data: sample,
        pagination: { page: 1, limit, total: 5, pages: 1, hasMore: false },
        message: "No real data yet. Analyse some courses first!" });
    }

    const total  = enriched.length;
    const paged  = enriched.slice(skip, skip + limit).map((x, i) => ({ ...x, rank: skip + i + 1 }));

    res.json({
      success: true, isSampleData: false,
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: skip + limit < total },
      period: `Last ${days} days`, sortBy,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/analytics/user/:userId ─────────────────────────────────────────
export const getUserAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const [analysisCount, mostSearched, marketDist, favCount, avgPop, last] = await Promise.all([
      History.countDocuments({ userId }),
      History.aggregate([
        { $match: { userId } },
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 1 },
        { $project: { _id: 0, courseName: "$_id", searchCount: "$count" } },
      ]),
      History.aggregate([
        { $match: { userId } },
        { $group: { _id: "$analysisResult.marketDemand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, demand: "$_id", count: 1 } },
      ]),
      Favorite.countDocuments({ userId }),
      History.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avg: { $avg: "$analysisResult.popularityScore" } } },
        { $project: { _id: 0, avg: { $round: ["$avg", 2] } } },
      ]),
      History.findOne({ userId }).sort({ createdAt: -1 }).select("courseName createdAt"),
    ]);

    res.json({
      success: true, userId,
      analytics: {
        analysisCount, favoriteCount: favCount,
        mostSearchedCourse: mostSearched[0] || null,
        marketDemandDistribution: marketDist,
        averagePopularityScore: avgPop[0]?.avg || 0,
        lastAnalysis: last,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers, totalAnalyses, totalFavorites, totalCachedCourses,
      topCourses, marketDist, difficultyDist, avgPop,
      topFavorites, trendingWeek, cacheHits, activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      History.countDocuments(),
      Favorite.countDocuments(),
      CourseCache.countDocuments(),

      History.aggregate([
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, courseName: "$_id", analysisCount: "$count" } },
      ]),
      History.aggregate([
        { $group: { _id: "$analysisResult.marketDemand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, demand: "$_id", count: 1 } },
      ]),
      History.aggregate([
        { $group: { _id: "$analysisResult.learningDifficulty", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, difficulty: "$_id", count: 1 } },
      ]),
      History.aggregate([
        { $group: { _id: null, avg: { $avg: "$analysisResult.popularityScore" } } },
        { $project: { _id: 0, avg: { $round: ["$avg", 2] } } },
      ]),
      Favorite.aggregate([
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, courseName: "$_id", favoriteCount: "$count" } },
      ]),
      History.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
        { $project: { _id: 0, courseName: "$_id", recentSearches: "$count" } },
      ]),
      CourseCache.aggregate([
        { $group: { _id: null, hits: { $sum: "$hitCount" } } },
        { $project: { _id: 0, hits: 1 } },
      ]),
      History.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: "$userId" } }, { $count: "count" },
      ]),
    ]);

    const hits    = cacheHits[0]?.hits || 0;
    const savings = (hits * 0.005).toFixed(2);

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalUsers, totalAnalyses, totalFavorites, totalCachedCourses,
          analysesPerUser: totalUsers ? +(totalAnalyses / totalUsers).toFixed(2) : 0,
          activeUsers: activeUsers[0]?.count || 0,
          averagePopularityScore: avgPop[0]?.avg || 0,
        },
        topAnalyzedCourses: topCourses,
        mostFavoritedCourses: topFavorites,
        trendingCoursesLastWeek: trendingWeek,
        marketDemandDistribution: marketDist,
        difficultyDistribution: difficultyDist,
        cacheStatistics: {
          totalCachedAnalyses: totalCachedCourses,
          totalCacheHits: hits,
          estimatedSavings: `$${savings}`,
          hitRate: totalCachedCourses ? +(hits / totalCachedCourses).toFixed(2) : 0,
        },
      },
      generatedAt: new Date(),
    });
  } catch (err) { next(err); }
};
