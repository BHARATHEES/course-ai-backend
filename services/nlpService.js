/**
 * NLP Sentiment Analysis Service
 * Analyzes sentiment from reviews, job descriptions, and market data
 * Uses basic NLP techniques for sentiment scoring and key phrase extraction
 */

class NLPService {
  // Positive keywords for sentiment analysis
  static POSITIVE_KEYWORDS = [
    "excellent", "amazing", "great", "wonderful", "fantastic", "awesome",
    "love", "perfect", "best", "brilliant", "outstanding", "impressive",
    "highly recommend", "very good", "superb", "marvelous", "enjoyable",
    "comprehensive", "clear", "well explained", "easy to understand",
    "practical", "hands-on", "real-world", "industry-relevant", "up-to-date",
    "engaging", "motivating", "inspiring", "helpful", "valuable"
  ];

  // Negative keywords for sentiment analysis
  static NEGATIVE_KEYWORDS = [
    "terrible", "awful", "bad", "horrible", "useless", "waste", "boring",
    "confusing", "unclear", "difficult", "slow", "outdated", "poor",
    "disappointing", "frustrated", "waste of time", "not worth", "expensive",
    "incomplete", "disorganized", "hard to follow", "weak instructor",
    "outdated content", "too fast", "too slow", "no support"
  ];

  /**
   * Analyze sentiment of text
   * Returns sentiment score (-1 to 1) and sentiment label
   */
  static analyzeSentiment(text) {
    if (!text || typeof text !== "string") {
      return { score: 0, sentiment: "Neutral" };
    }

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    // Count occurrences of positive keywords
    this.POSITIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerText.match(regex);
      positiveCount += matches ? matches.length : 0;
    });

    // Count occurrences of negative keywords
    this.NEGATIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerText.match(regex);
      negativeCount += matches ? matches.length : 0;
    });

    // Calculate sentiment score
    const total = positiveCount + negativeCount;
    let score = 0;

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
    }

    // Determine sentiment label
    let sentiment = "Neutral";
    if (score > 0.5) sentiment = "Very Positive";
    else if (score > 0.2) sentiment = "Positive";
    else if (score < -0.5) sentiment = "Negative";
    else if (score < -0.2) sentiment = "Somewhat Negative";

    return {
      score: Math.max(-1, Math.min(1, score)),
      sentiment: sentiment,
      positiveCount: positiveCount,
      negativeCount: negativeCount
    };
  }

  /**
   * Extract key phrases from text using simple NLP techniques
   */
  static extractKeyPhrases(text, topN = 5) {
    if (!text || typeof text !== "string") return [];

    // Remove stopwords and extract meaningful phrases
    const stopwords = new Set([
      "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
      "in", "with", "to", "for", "of", "by", "as", "from", "it", "be",
      "this", "that", "was", "were", "have", "has", "do", "did", "will",
      "would", "could", "should", "may", "might", "must", "can", "am", "are"
    ]);

    // Extract phrases (split by common delimiters)
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));

    // Create bigrams and trigrams for better phrase extraction
    const phrases = [];

    // Single words
    for (let i = 0; i < words.length; i++) {
      phrases.push(words[i]);
    }

    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }

    // Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }

    // Count frequency and sort
    const phraseFreq = {};
    phrases.forEach(phrase => {
      phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
    });

    return Object.entries(phraseFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([phrase]) => phrase);
  }

  /**
   * Calculate demand trend using simple time series analysis
   */
  static calculateDemandTrend(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return { trend: "stable", growthRate: 0 };
    }

    // Sort by date
    const sorted = [...historicalData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Calculate growth rate from first to last
    const firstValue = sorted[0]?.demandScore || 0;
    const lastValue = sorted[sorted.length - 1]?.demandScore || firstValue;

    const growthRate =
      firstValue !== 0
        ? ((lastValue - firstValue) / firstValue) * 100
        : 0;

    let trend = "stable";
    if (growthRate > 10) trend = "rising";
    else if (growthRate > 5) trend = "gradually increasing";
    else if (growthRate < -10) trend = "declining";
    else if (growthRate < -5) trend = "gradually declining";

    return {
      trend: trend,
      growthRate: Math.round(growthRate * 10) / 10
    };
  }

  /**
   * Generate market insights from sentiment and trend data
   */
  static generateInsights(marketData) {
    const insights = [];

    // Popularity insights
    if (marketData.popularity) {
      const { trendScore, enrollmentCount, courseRating } = marketData.popularity;

      if (trendScore > 80) {
        insights.push({
          category: "Popularity",
          message: `📈 Highly trending skill with ${enrollmentCount.toLocaleString()} enrollments and ${courseRating.toFixed(1)} rating`,
          severity: "positive"
        });
      } else if (trendScore > 60) {
        insights.push({
          category: "Popularity",
          message: `📊 Moderately popular with growing interest`,
          severity: "neutral"
        });
      }
    }

    // Salary insights
    if (marketData.salary) {
      const { averageExperienced, salaryGrowthPercent } = marketData.salary;

      if (averageExperienced > 100000) {
        insights.push({
          category: "Compensation",
          message: `💰 High-paying skill with average salary of $${averageExperienced.toLocaleString()} and ${salaryGrowthPercent.toFixed(1)}% annual growth`,
          severity: "positive"
        });
      }
    }

    // Demand insights
    if (marketData.demand) {
      const { demandScore, openPositions, yoyGrowth } = marketData.demand;

      if (demandScore > 80) {
        insights.push({
          category: "Job Market",
          message: `🚀 Exceptional demand with ${openPositions.toLocaleString()} open positions and ${yoyGrowth.toFixed(1)}% YoY growth`,
          severity: "positive"
        });
      } else if (demandScore > 60) {
        insights.push({
          category: "Job Market",
          message: `📍 Good market demand with moderate growth opportunities`,
          severity: "neutral"
        });
      }
    }

    // Sentiment insights
    if (marketData.sentimentAnalysis) {
      const { overallSentiment, sentimentScore } = marketData.sentimentAnalysis;

      if (sentimentScore > 0.7) {
        insights.push({
          category: "Community",
          message: `👍 Excellent student reviews and community satisfaction`,
          severity: "positive"
        });
      } else if (sentimentScore < -0.5) {
        insights.push({
          category: "Community",
          message: `⚠️ Mixed reviews - consider carefully`,
          severity: "warning"
        });
      }
    }

    // ML Insights
    if (marketData.mlInsights) {
      const { recommendationScore, skillDeprecationRisk } = marketData.mlInsights;

      if (recommendationScore > 85) {
        insights.push({
          category: "ML Recommendation",
          message: `⭐ Highly recommended for career growth with low obsolescence risk`,
          severity: "positive"
        });
      }

      if (skillDeprecationRisk > 50) {
        insights.push({
          category: "Future Risk",
          message: `⚠️ Moderate risk of skill deprecation - stay updated`,
          severity: "warning"
        });
      }
    }

    return insights;
  }

  /**
   * Analyze skill clustering - which skills are learned together
   */
  static analyzeSkillClusteringPatterns(courseNames) {
    // Simulated skill clustering based on domain knowledge
    const clusters = {
      dataScience: ["Python", "SQL", "Machine Learning", "Statistics", "Big Data", "R"],
      webDevelopment: ["JavaScript", "React", "Node.js", "CSS", "HTML", "TypeScript"],
      cloudComputing: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"],
      ai: ["Deep Learning", "Neural Networks", "TensorFlow", "PyTorch", "NLP"],
      devops: ["Docker", "Kubernetes", "Jenkins", "Linux", "AWS", "Terraform"]
    };

    const analyzedCourses = [];

    courseNames.forEach(course => {
      const name = course.toLowerCase();
      let relatedCluster = null;
      let skills = [];

      // Find which cluster the skill belongs to
      for (const [cluster, skillList] of Object.entries(clusters)) {
        if (skillList.some(skill => name.includes(skill.toLowerCase()))) {
          relatedCluster = cluster;
          skills = skillList.filter(skill => !name.includes(skill.toLowerCase()));
          break;
        }
      }

      analyzedCourses.push({
        skill: course,
        cluster: relatedCluster || "other",
        complementarySkills: skills
      });
    });

    return analyzedCourses;
  }
}

export default NLPService;
