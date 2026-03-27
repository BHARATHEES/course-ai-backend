/**
 * External API Service
 * Integrates with free/accessible third-party APIs:
 * - Coursera: Course data
 * - GitHub: Trending repositories
 * 
 * Note: Market insights are now generated via HuggingFace AI Service
 */

class ExternalApiService {

  /**
   * Udemy Affiliate API - DISABLED (Paid API)
   * Kept for reference - Udemy requires paid account
   * Using Coursera API instead for free course data
   */
  static async getUdemyCourseData(courseKeyword) {
    console.log("ℹ️  Udemy API is a paid service. Using Coursera API instead.");
    return null;
  }

  /**
   * Coursera API - Get course data via public search
   * Free tier - no auth required for search
   * Docs: https://building.coursera.org/
   */
  static async getCourseraData(courseKeyword) {
    const startTime = Date.now();
    try {
      // Coursera search endpoint (public)
      const url = `https://www.coursera.org/api/onDemandCourses.v1?q=search&query=${encodeURIComponent(courseKeyword)}&limit=5`;

      const res = await fetch(url, { timeout: 8000 });
      const duration = Date.now() - startTime;
      
      if (!res.ok) throw new Error(`Coursera API error: ${res.status}`);

      const data = await res.json();
      const courses = data.elements || [];

      console.log(`⏱️  Coursera API completed in ${duration}ms`);

      return {
        courseCount: courses.length,
        topCourses: courses.slice(0, 3).map(c => ({
          title: c.name,
          enrollments: c.enrollments || 0,
          partner: c.partner?.name || "Unknown",
          duration: c.courseSpecificDuration || "N/A"
        })),
        totalEnrollments: courses.reduce((sum, c) => sum + (c.enrollments || 0), 0),
        fetchedAt: new Date(),
        source: "Coursera API",
        responseTime: duration
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`❌ Coursera API error (${duration}ms):`, err.message);
      return null;
    }
  }

  /**
   * LinkedIn Jobs Scraper via RapidAPI (JSearch)
   * REMOVED - Using HuggingFace Market Insights Service Instead
   * 
   * For market data (trends, demand, salary, predictions), use:
   * HuggingFaceMarketInsightsService.generateMarketInsights(courseName)
   */

  /**
   * GitHub Trending - Get trending repositories for a skill
   * Free - no auth required
   */
  static async getGitHubTrending(language) {
    try {
      const url = `https://api.github.com/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=5`;

      const res = await fetch(url, { timeout: 8000 });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

      const data = await res.json();
      const repos = data.items || [];

      return {
        trendingReposCount: data.total_count,
        topRepos: repos.slice(0, 3).map(r => ({
          name: r.name,
          stars: r.stargazers_count,
          description: r.description,
          language: r.language,
          url: r.html_url
        })),
        fetchedAt: new Date(),
        source: "GitHub API"
      };
    } catch (err) {
      console.error("❌ GitHub API error:", err.message);
      return null;
    }
  }
}

export default ExternalApiService;
