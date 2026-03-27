import MarketData from "../models/MarketData.js";
import ExternalApiService from "./externalApiService.js";
import HuggingFaceMarketInsightsService from "./huggingFaceMarketInsightsService.js";

/**
 * Data Aggregation Service
 * Collects data from multiple sources:
 * - HuggingFace AI: Market insights, trends, demand, ML predictions
 * - Coursera: Course platform data
 * - GitHub: Trending repositories
 */

class DataAggregationService {
  /**
   * Aggregate data from multiple sources
   * Simulates real data collection for demonstration
   */
  static async aggregateMarketData(courseName) {
    try {
      const startTime = Date.now();
      console.log(`📊 Aggregating market data for: ${courseName}`);

      // Check if we already have cached data
      let marketData = await MarketData.findOne({ 
        courseName: courseName.toLowerCase() 
      });

      // If data exists and is recent (< 1 hour), return cached data
      // BUT skip if it contains "Simulated" (old demo data)
      if (marketData && this.isCacheValid(marketData.lastUpdated)) {
        if (marketData.dataSource && marketData.dataSource.some(s => s?.includes("Simulated"))) {
          console.log(`⚠️  Cache contains old simulated data. Fetching fresh data...`);
        } else {
          const cacheHitDuration = Date.now() - startTime;
          console.log(`✅ Using cached market data for ${courseName} (${cacheHitDuration}ms)`);
          return marketData;
        }
      }

      // Otherwise, aggregate new data
      marketData = await this.collectAndProcessData(courseName);
      
      // Save to database
      const saved = await MarketData.findOneAndUpdate(
        { courseName: courseName.toLowerCase() },
        marketData,
        { upsert: true, new: true }
      );

      const totalDuration = Date.now() - startTime;
      console.log(`✅ Market data aggregated and saved for ${courseName} (Total: ${totalDuration}ms)`);
      return saved;
    } catch (error) {
      console.error(`❌ Error aggregating market data:`, error);
      throw error;
    }
  }

  /**
   * Collect and process data from sources
   * Fetches from HuggingFace AI, Coursera, GitHub APIs
   */
  static async collectAndProcessData(courseName) {
    const courseNameLower = courseName.toLowerCase();
    const aggregationStart = Date.now();
    console.log(`🌐 Fetching data for: ${courseName}`);

    // Parallel API calls
    const apiStart = Date.now();
    const [hfInsights, courseraData, githubData] = await Promise.allSettled([
      HuggingFaceMarketInsightsService.generateMarketInsights(courseName),
      ExternalApiService.getCourseraData(courseName),
      ExternalApiService.getGitHubTrending(this.extractLanguage(courseName))
    ]).then(results => results.map(r => r.status === "fulfilled" ? r.value : null));
    
    const apiDuration = Date.now() - apiStart;
    console.log(`⏱️  All API calls completed in ${apiDuration}ms`);

    // Build metrics from HuggingFace insights + other APIs
    const realMetrics = this.buildMetricsFromHF(
      courseName,
      hfInsights,
      courseraData,
      githubData
    );

    return {
      courseName: courseNameLower,
      popularity: realMetrics.popularity,
      difficulty: realMetrics.difficulty,
      salary: realMetrics.salary,
      demand: realMetrics.demand,
      marketComposition: this.generateMarketComposition(),
      sentimentAnalysis: await this.generateSentimentAnalysis(courseName),
      trends: this.generateTrends(courseName),
      mlInsights: this.generateMLInsights(realMetrics),
      dataSource: [
        hfInsights ? "HuggingFace AI" : null,
        courseraData ? "Coursera API" : null,
        githubData ? "GitHub API" : null
      ].filter(Boolean),
      apiData: {
        huggingface: hfInsights,
        coursera: courseraData,
        github: githubData
      },
      lastUpdated: new Date(),
      updateFrequency: "daily",
      confidenceScore: this.calculateConfidenceScore([hfInsights, courseraData, githubData]),
      historicalData: []
    };
  }

  /**
   * Build metrics from HuggingFace AI insights
   * Uses: HuggingFace (AI insights), Coursera (courses), GitHub (trending)
   */
  static buildMetricsFromHF(courseName, hfInsights, coursera, github) {
    // Use HuggingFace insights as primary data source
    const avgSalary = hfInsights?.salary?.averageExperiencedINR || 1200000;
    const demandScore = hfInsights?.demand?.demandScore || 65;
    const trendScore = hfInsights?.trends?.trendingScore || 60;
    const totalCourseraEnrollments = coursera?.totalEnrollments || 0;
    
    return {
      popularity: {
        enrollmentCount: totalCourseraEnrollments,
        trendScore: trendScore,
        reviewCount: Math.floor(totalCourseraEnrollments * 0.15),
        courseRating: 4.2 + Math.random() * 0.5,
        monthlySearchVolume: Math.max(demandScore * 100, 1000)
      },
      difficulty: {
        level: this.estimateDifficulty(courseName, demandScore),
        estimatedHours: this.estimateHours(courseName),
        completionRate: 45 + Math.random() * 20
      },
      salary: {
        averageStarting: hfInsights?.salary?.averageBeginnerINR || 500000,
        averageExperienced: avgSalary,
        salaryGrowthPercent: hfInsights?.salary?.salaryGrowthPercent || 10,
        topCompanies: hfInsights?.topCompanies || []
      },
      demand: {
        openPositions: hfInsights?.demand?.openPositions || 5000,
        demandScore: demandScore,
        topLocations: this.extractLocations(hfInsights?.geographicalDistribution),
        jobTrend: hfInsights?.trends?.jobTrendDirection || "Stable"
      }
    };
  }

  /**
   * Extract programming language from course name
   */
  static extractLanguage(courseName) {
    const langs = {
      python: "Python",
      javascript: "JavaScript",
      java: "Java",
      cpp: "C++",
      csharp: "C#",
      typescript: "TypeScript",
      golang: "Go",
      rust: "Rust",
      php: "PHP",
      ruby: "Ruby"
    };

    for (const [key, lang] of Object.entries(langs)) {
      if (courseName.toLowerCase().includes(key)) return lang;
    }
    return "Python"; // default
  }

  /**
   * Estimate difficulty based on market demand
   */
  static estimateDifficulty(courseName, demandScore = 65) {
    const name = courseName.toLowerCase();
    
    if (name.includes("ai") || name.includes("ml")) return "Advanced";
    if (name.includes("devops") || name.includes("kubernetes")) return "Advanced";
    if (name.includes("blockchain")) return "Advanced";
    if (demandScore > 75) return "Intermediate";
    return "Beginner";
  }

  /**
   * Extract top locations from geographical distribution
   */
  static extractLocations(geoDistribution) {
    if (!geoDistribution) return [];
    
    const locations = [
      { name: "India", percentage: geoDistribution.india || 0 },
      { name: "North America", percentage: geoDistribution.northAmerica || 0 },
      { name: "Europe", percentage: geoDistribution.europe || 0 },
      { name: "Asia-Pacific", percentage: geoDistribution.asiaPacific || 0 }
    ];

    return locations
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map(l => l.name);
  }

  /**
   * Estimate learning hours
   */
  static estimateHours(courseName) {
    const name = courseName.toLowerCase();
    if (name.includes("beginner")) return 40;
    if (name.includes("advanced")) return 120;
    return 80;
  }

  /**
   * Calculate confidence score based on data availability
   */
  static calculateConfidenceScore(dataSources) {
    const availableSources = dataSources.filter(d => d !== null).length;
    return Math.round((availableSources / dataSources.length) * 100);
  }

  /**
   * Generate base metrics based on course characteristics
   */
  static generateBaseMetrics(courseName) {
    const name = courseName.toLowerCase();
    
    // Base values that vary by course type
    let enrollment = 50000;
    let difficulty = "Intermediate";
    let salary = 75000;
    let demand = 65;
    let trendScore = 60;

    // Tech-specific metrics
    if (name.includes("data science") || name.includes("machine learning")) {
      enrollment = 125000;
      difficulty = "Advanced";
      salary = 120000;
      demand = 95;
      trendScore = 95;
    } else if (name.includes("python") || name.includes("javascript")) {
      enrollment = 150000;
      difficulty = "Intermediate";
      salary = 100000;
      demand = 90;
      trendScore = 85;
    } else if (name.includes("web") || name.includes("react")) {
      enrollment = 80000;
      difficulty = "Intermediate";
      salary = 95000;
      demand = 85;
      trendScore = 75;
    } else if (name.includes("cloud") || name.includes("aws")) {
      enrollment = 70000;
      difficulty = "Advanced";
      salary = 110000;
      demand = 80;
      trendScore = 80;
    } else if (name.includes("blockchain") || name.includes("crypto")) {
      enrollment = 45000;
      difficulty = "Advanced";
      salary = 130000;
      demand = 55;
      trendScore = 70;
    } else if (name.includes("ai") || name.includes("artificial")) {
      enrollment = 95000;
      difficulty = "Advanced";
      salary = 135000;
      demand = 88;
      trendScore = 92;
    }

    return {
      popularity: {
        enrollmentCount: enrollment,
        trendScore: trendScore,
        monthlySearchVolume: Math.floor(enrollment / 10),
        courseRating: 4.2 + Math.random() * 0.7,
        reviewCount: Math.floor(enrollment * 0.15)
      },
      difficulty: {
        level: difficulty,
        averageScore: difficulty === "Beginner" ? 85 : difficulty === "Intermediate" ? 75 : 65,
        completionRate: difficulty === "Beginner" ? 70 : difficulty === "Intermediate" ? 55 : 40,
        estimatedHours: difficulty === "Beginner" ? 40 : difficulty === "Intermediate" ? 80 : 120
      },
      salary: {
        averageStarting: Math.floor(salary * 0.85),
        averageExperienced: salary,
        salaryGrowthPercent: 8 + Math.random() * 5,
        companiesOfferingPremium: this.getTopCompanies(name)
      },
      demand: {
        openPositions: Math.floor(enrollment / 5),
        demandScore: demand,
        yoyGrowth: 5 + Math.random() * 15,
        skillFrequencyInJobs: demand,
        topIndustries: this.getTopIndustries(name)
      }
    };
  }

  /**
   * Get top companies for a given skill
   */
  static getTopCompanies(courseName) {
    const techCompanies = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Tesla", "IBM"];
    const financialCompanies = ["JP Morgan", "Goldman Sachs", "Citadel", "Stripe"];
    const startups = ["OpenAI", "Anthropic", "Hugging Face", "Databricks"];
    
    if (courseName.includes("ai") || courseName.includes("machine learning") || courseName.includes("data science")) {
      return [...techCompanies, ...startups].slice(0, 5);
    } else if (courseName.includes("finance") || courseName.includes("risk")) {
      return financialCompanies;
    }
    return techCompanies.slice(0, 5);
  }

  /**
   * Get top industries hiring for this skill
   */
  static getTopIndustries(courseName) {
    const defaultIndustries = ["Technology", "Finance", "Healthcare", "E-commerce"];
    
    if (courseName.includes("financial") || courseName.includes("trading")) {
      return ["Finance", "Banking", "Insurance", "Investment"];
    } else if (courseName.includes("healthcare") || courseName.includes("medical")) {
      return ["Healthcare", "Pharmaceuticals", "Medical Devices", "Biotech"];
    }
    return defaultIndustries;
  }

  /**
   * Generate market composition data (for pie charts)
   */
  static generateMarketComposition() {
    return {
      byRegion: {
        northAmerica: 35 + Math.random() * 10,
        europe: 25 + Math.random() * 8,
        asia: 30 + Math.random() * 8,
        other: 10 + Math.random() * 5
      },
      byDifficulty: {
        beginnerStudents: 40 + Math.random() * 10,
        intermediateStudents: 35 + Math.random() * 10,
        advancedStudents: 25 + Math.random() * 8
      },
      byJobRole: {
        dataScientist: 25 + Math.random() * 10,
        softwareEngineer: 35 + Math.random() * 10,
        dataAnalyst: 20 + Math.random() * 8,
        machineLearningEngineer: 15 + Math.random() * 7,
        other: 5 + Math.random() * 5
      }
    };
  }

  /**
   * Generate sentiment analysis (requires NLP service)
   */
  static async generateSentimentAnalysis(courseName) {
    // This would be done by NLP service
    let sentiment = "Positive";
    let score = 0.6 + Math.random() * 0.35;

    if (courseName.toLowerCase().includes("beginners") || courseName.toLowerCase().includes("intro")) {
      sentiment = "Very Positive";
      score = 0.75 + Math.random() * 0.2;
    }

    return {
      overallSentiment: sentiment,
      sentimentScore: score,
      positiveMentions: 250 + Math.floor(Math.random() * 300),
      negativeMentions: 20 + Math.floor(Math.random() * 50),
      keyPhrases: [
        "Great for beginners",
        "Very comprehensive",
        "Excellent instructor",
        "Practical projects",
        "Good pacing"
      ],
      reviewSummary: `${courseName} is highly regarded for comprehensive coverage and practical applications. Students appreciate the structured learning path and real-world projects.`
    };
  }

  /**
   * Generate trending data
   */
  static generateTrends(courseName) {
    const name = courseName.toLowerCase();
    let isRising = true;
    let relatedSkills = ["Python", "SQL", "Git"];
    let alternativeSkills = ["R", "Julia"];

    if (name.includes("data science") || name.includes("ai")) {
      isRising = true;
      relatedSkills = ["Python", "SQL", "Machine Learning", "Statistics", "Big Data"];
      alternativeSkills = ["R", "Scala", "Julia"];
    } else if (name.includes("web")) {
      relatedSkills = ["JavaScript", "React", "Node.js", "CSS", "HTML"];
      alternativeSkills = ["Vue.js", "Angular", "Svelte"];
    } else if (name.includes("cloud")) {
      relatedSkills = ["Docker", "Kubernetes", "DevOps", "Linux"];
      alternativeSkills = ["Azure", "Google Cloud"];
    }

    return {
      isRising: isRising,
      peakSearchMonth: ["January", "May", "September"][Math.floor(Math.random() * 3)],
      relatedSkills: relatedSkills,
      alternativeSkills: alternativeSkills
    };
  }

  /**
   * Generate ML insights and predictions
   */
  static generateMLInsights(baseMetrics) {
    const demandScore = baseMetrics.demand?.demandScore || 50;
    const trendScore = baseMetrics.popularity?.trendScore || 50;
    const enrollmentCount = baseMetrics.popularity?.enrollmentCount || 0;

    // Ensure all values are valid numbers, not NaN
    const safeDemandScore = isNaN(demandScore) ? 50 : demandScore;
    const safeTrendScore = isNaN(trendScore) ? 50 : trendScore;

    return {
      predictedDemandNext6Months: Math.min(100, Math.max(0, safeDemandScore + (Math.random() * 20 - 10))),
      recommendationScore: Math.min(100, Math.max(0, (safeDemandScore + safeTrendScore) / 2 + Math.random() * 10)),
      skillDeprecationRisk: Math.max(0, Math.min(100, 100 - safeDemandScore - safeTrendScore / 2)),
      careerpathAlignment: [
        { path: "Software Engineer", alignment: 85 + Math.random() * 15 },
        { path: "Data Scientist", alignment: 75 + Math.random() * 20 },
        { path: "DevOps Engineer", alignment: 65 + Math.random() * 20 },
        { path: "Tech Lead", alignment: 55 + Math.random() * 25 }
      ]
    };
  }

  /**
   * Check if cached data is still valid (< 1 hour old for testing real APIs)
   * Change back to 7 days once you're satisfied with real API data
   */
  static isCacheValid(lastUpdated) {
    if (!lastUpdated) return false;
    const hoursDiff = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60);
    return hoursDiff < 1; // Force fresh data every hour to test real APIs
  }

  /**
   * Get top trending courses
   */
  static async getTrendingCourses(limit = 10) {
    try {
      const trending = await MarketData.find()
        .sort({ "popularity.trendScore": -1 })
        .limit(limit)
        .select("courseName popularity demand salary sentimentAnalysis");
      
      return trending;
    } catch (error) {
      console.error("Error fetching trending courses:", error);
      throw error;
    }
  }

  /**
   * Compare multiple courses market data
   */
  static async compareCoursesMarketData(courseNames) {
    try {
      const courses = await Promise.all(
        courseNames.map(name => this.aggregateMarketData(name))
      );
      
      return courses;
    } catch (error) {
      console.error("Error comparing courses:", error);
      throw error;
    }
  }

  /**
   * Get market statistics
   */
  static async getMarketStatistics() {
    try {
      const stats = await MarketData.aggregate([
        {
          $group: {
            _id: null,
            totalCourses: { $sum: 1 },
            avgDemandScore: { $avg: "$demand.demandScore" },
            avgSalary: { $avg: "$salary.averageExperienced" },
            avgPopularityScore: { $avg: "$popularity.trendScore" },
            totalEnrollments: { $sum: "$popularity.enrollmentCount" }
          }
        }
      ]);

      return stats[0] || {};
    } catch (error) {
      console.error("Error getting market statistics:", error);
      throw error;
    }
  }
}

export default DataAggregationService;
