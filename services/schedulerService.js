import DataAggregationService from './dataAggregationService.js';
import MarketData from '../models/MarketData.js';

/**
 * Scheduler Service
 * Manages periodic data collection and updates for market analysis
 */

class SchedulerService {
  constructor() {
    this.jobIntervals = new Map();
    this.popularCourses = [
      'Python',
      'Data Science',
      'Machine Learning',
      'JavaScript',
      'Web Development',
      'React',
      'Node.js',
      'Cloud Computing',
      'AWS',
      'Docker',
      'Kubernetes',
      'Artificial Intelligence',
      'Deep Learning',
      'SQL',
      'Java'
    ];
  }

  /**
   * Start the scheduler - run periodic data aggregation
   */
  async startScheduler() {
    console.log('🚀 Starting Market Data Scheduler...');

    // Collect data for popular courses immediately
    await this.aggregatePopularCourses();

    // Set up interval to refresh data every 7 days
    const weeklyInterval = setInterval(async () => {
      console.log('📅 Running weekly market data update...');
      await this.aggregatePopularCourses();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store interval reference for cleanup
    this.jobIntervals.set('weeklyAggregation', weeklyInterval);

    // Trending analysis every 24 hours
    const dailyInterval = setInterval(async () => {
      console.log('📊 Running daily market analysis...');
      await this.analyzeTrends();
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.jobIntervals.set('dailyAnalysis', dailyInterval);

    console.log('✅ Market Data Scheduler started successfully');
  }

  /**
   * Aggregate data for all popular courses
   */
  async aggregatePopularCourses() {
    try {
      console.log(`📦 Aggregating data for ${this.popularCourses.length} popular courses...`);

      const results = await Promise.allSettled(
        this.popularCourses.map(course =>
          DataAggregationService.aggregateMarketData(course).catch(err => {
            console.error(`Error aggregating ${course}:`, err.message);
            return null;
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`✅ Successfully aggregated ${successful}/${this.popularCourses.length} courses`);

      return results;
    } catch (error) {
      console.error('❌ Error in aggregatePopularCourses:', error);
    }
  }

  /**
   * Analyze trends in market data
   */
  async analyzeTrends() {
    try {
      console.log('📈 Analyzing market trends...');

      // Get all market data
      const allCourses = await MarketData.find().select('courseName demand popularity salary');

      // Calculate trend metrics
      const avgDemand = allCourses.reduce((sum, c) => sum + (c.demand?.demandScore || 0), 0) / (allCourses.length || 1);
      const avgSalary = allCourses.reduce((sum, c) => sum + (c.salary?.averageExperienced || 0), 0) / (allCourses.length || 1);
      const avgPopularity = allCourses.reduce((sum, c) => sum + (c.popularity?.trendScore || 0), 0) / (allCourses.length || 1);

      // Find top performers
      const topByDemand = allCourses.reduce((prev, current) =>
        (prev.demand?.demandScore || 0) > (current.demand?.demandScore || 0) ? prev : current
      );

      const topBySalary = allCourses.reduce((prev, current) =>
        (prev.salary?.averageExperienced || 0) > (current.salary?.averageExperienced || 0) ? prev : current
      );

      console.log('📊 Market Trend Analysis:');
      console.log(`- Average Demand Score: ${avgDemand.toFixed(2)}`);
      console.log(`- Average Salary: $${avgSalary.toFixed(0)}`);
      console.log(`- Average Popularity: ${avgPopularity.toFixed(2)}`);
      console.log(`- Top by Demand: ${topByDemand.courseName}`);
      console.log(`- Top by Salary: ${topBySalary.courseName}`);

      return {
        avgDemand,
        avgSalary,
        avgPopularity,
        topByDemand: topByDemand.courseName,
        topBySalary: topBySalary.courseName
      };
    } catch (error) {
      console.error('❌ Error analyzing trends:', error);
    }
  }

  /**
   * Add a new course to the scheduler
   */
  async addCourseToSchedule(courseName) {
    try {
      if (!this.popularCourses.includes(courseName)) {
        this.popularCourses.push(courseName);
        await DataAggregationService.aggregateMarketData(courseName);
        console.log(`✅ Added ${courseName} to scheduler`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error adding course to schedule:`, error);
    }
  }

  /**
   * Get current market statistics
   */
  async getMarketStatistics() {
    try {
      const totalCourses = await MarketData.countDocuments();

      const stats = await MarketData.aggregate([
        {
          $group: {
            _id: null,
            avgDemand: { $avg: '$demand.demandScore' },
            avgSalary: { $avg: '$salary.averageExperienced' },
            maxSalary: { $max: '$salary.averageExperienced' },
            minSalary: { $min: '$salary.averageExperienced' },
            avgPopularity: { $avg: '$popularity.trendScore' },
            totalEnrollments: { $sum: '$popularity.enrollmentCount' }
          }
        }
      ]);

      return {
        totalCourses,
        ...(stats[0] || {})
      };
    } catch (error) {
      console.error('Error getting market statistics:', error);
    }
  }

  /**
   * Update historical data for tracking trends
   */
  async updateHistoricalData() {
    try {
      console.log('📝 Updating historical data...');

      const courses = await MarketData.find();

      for (const course of courses) {
        // Add current metrics to historical data
        course.historicalData = course.historicalData || [];
        course.historicalData.push({
          date: new Date(),
          enrollmentCount: course.popularity?.enrollmentCount || 0,
          openPositions: course.demand?.openPositions || 0,
          averageSalary: course.salary?.averageExperienced || 0,
          demandScore: course.demand?.demandScore || 0
        });

        // Keep only last 52 weeks of data
        if (course.historicalData.length > 52) {
          course.historicalData = course.historicalData.slice(-52);
        }

        await course.save();
      }

      console.log(`✅ Updated historical data for ${courses.length} courses`);
    } catch (error) {
      console.error('Error updating historical data:', error);
    }
  }

  /**
   * Get market insights summary
   */
  async getMarketInsightsSummary() {
    try {
      const stats = await this.getMarketStatistics();
      const trending = await DataAggregationService.getTrendingCourses(5);

      return {
        marketStats: stats,
        trendingCourses: trending,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating market insights summary:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    console.log('⏹️ Stopping Market Data Scheduler...');

    for (const [name, interval] of this.jobIntervals) {
      clearInterval(interval);
      console.log(`Cleared job: ${name}`);
    }

    this.jobIntervals.clear();
    console.log('✅ Scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus() {
    return {
      running: this.jobIntervals.size > 0,
      activeJobs: Array.from(this.jobIntervals.keys()),
      coursesMonitored: this.popularCourses.length,
      courses: this.popularCourses
    };
  }
}

// Create singleton instance
const schedulerInstance = new SchedulerService();

export default schedulerInstance;
