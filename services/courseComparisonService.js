import MarketInsights from "../models/MarketInsights.js";

/**
 * Course Comparison Service
 * Compares 2-5 courses and provides detailed analysis using HuggingFace AI
 * Includes: Course definitions, market comparison, best recommendations, skill requirements
 */

class CourseComparisonService {
  /**
   * Compare multiple courses
   */
  static async compareCourses(courseNames) {
    try {
      console.log(`📊 Comparing ${courseNames.length} courses: ${courseNames.join(", ")}`);

      // Validate input
      if (!courseNames || courseNames.length < 2 || courseNames.length > 5) {
        throw new Error("Please provide 2-5 courses to compare");
      }

      // Fetch market insights for each course
      const courseInsights = {};
      for (const courseName of courseNames) {
        const cached = await MarketInsights.findOne({
          courseName: courseName.toLowerCase(),
        });
        
        if (!cached) {
          // Generate insights if not cached
          const insights = this.generateDefaultInsights(courseName);
          courseInsights[courseName.toLowerCase()] = insights;
        } else {
          courseInsights[courseName.toLowerCase()] = cached.toObject();
        }
      }

      // Generate comparison analysis using HuggingFace
      const comparison = await this.generateComparison(courseNames, courseInsights);

      // Calculate rankings
      const rankings = this.calculateRankings(courseInsights, comparison);

      // Generate best recommendation
      const recommendation = this.generateRecommendation(rankings, courseInsights, comparison);

      return {
        success: true,
        courses: courseNames.map(name => name.toLowerCase()),
        insights: courseInsights,
        comparison,
        rankings,
        recommendation,
        timestamp: new Date(),
        dataSource: "HuggingFace AI + Market Intelligence"
      };
    } catch (error) {
      console.error(`❌ Course comparison error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate comparison analysis using HuggingFace API
   */
  static async generateComparison(courseNames, courseInsights) {
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) {
      console.warn("⚠️  HF_API_KEY not configured. Using local comparison only.");
      return this.generateLocalComparison(courseNames, courseInsights);
    }

    try {
      const courseList = courseNames.map(name => `- ${name}`).join("\n");
      const prompt = `Compare these ${courseNames.length} courses: ${courseList}

For each course, provide:
1. Detailed definition and what it covers
2. Difficulty level (Beginner/Intermediate/Advanced)
3. Time investment needed
4. Career prospects
5. Industry adoption percentage
6. Top 3 job roles
7. Key skills required

Format as JSON:
{
  "courses": {
    "course_name": {
      "definition": "...",
      "difficultyLevel": "Beginner/Intermediate/Advanced",
      "timeInvestment": "X months",
      "careerProspects": "...",
      "industryAdoption": 0-100,
      "topJobRoles": ["Role1", "Role2", "Role3"],
      "keySkills": ["Skill1", "Skill2", "Skill3"],
      "salaryRange": "₹X lakhs - ₹Y lakhs",
      "futureRelevance": "..."
    }
  },
  "comparison": {
    "easiestToLearn": "course_name",
    "bestForStartups": "course_name",
    "bestForEnterprise": "course_name",
    "fastestROI": "course_name",
    "bestForRemoteWork": "course_name",
    "overallBest": "course_name"
  },
  "summary": "..."
}

Return ONLY valid JSON.`;

      console.log(`🌐 Calling HuggingFace API for course comparison...`);
      
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.1",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        }),
        timeout: 30000,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️  HuggingFace API returned ${response.status}. Using local comparison.`);
        return this.generateLocalComparison(courseNames, courseInsights);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || "";
      
      if (!aiText) {
        return this.generateLocalComparison(courseNames, courseInsights);
      }

      // Extract JSON from response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.generateLocalComparison(courseNames, courseInsights);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.warn(`⚠️  HuggingFace comparison failed: ${error.message}`);
      return this.generateLocalComparison(courseNames, courseInsights);
    }
  }

  /**
   * Generate local comparison (fallback)
   */
  static generateLocalComparison(courseNames, courseInsights) {
    const courseComparison = {};
    
    const courseData = {
      "data science": {
        definition: "Data Science is the interdisciplinary field that uses statistics, ML, and programming to extract insights from data",
        difficultyLevel: "Advanced",
        timeInvestment: "6-12 months",
        careerProspects: "Excellent - High demand in tech, finance, and healthcare industries",
        industryAdoption: 92,
        topJobRoles: ["Data Scientist", "ML Engineer", "Analytics Manager"],
        keySkills: ["Python", "SQL", "Machine Learning", "Statistics", "R"],
        salaryRange: "₹8 lakhs - ₹25 lakhs"
      },
      "machine learning": {
        definition: "Machine Learning focuses on building intelligent systems that learn from data without explicit programming",
        difficultyLevel: "Advanced",
        timeInvestment: "8-14 months",
        careerProspects: "Very High - Rapidly growing field with cutting-edge opportunities",
        industryAdoption: 94,
        topJobRoles: ["ML Engineer", "AI Researcher", "Deep Learning Specialist"],
        keySkills: ["Python", "TensorFlow", "PyTorch", "Neural Networks", "Deep Learning"],
        salaryRange: "₹12 lakhs - ₹30 lakhs"
      },
      "python": {
        definition: "Python is a versatile programming language used for web development, data science, automation, and more",
        difficultyLevel: "Beginner",
        timeInvestment: "3-6 months",
        careerProspects: "Excellent - Most in-demand programming language across industries",
        industryAdoption: 96,
        topJobRoles: ["Python Developer", "Backend Engineer", "Automation Specialist"],
        keySkills: ["OOP", "Django/Flask", "Async Programming", "Testing", "Git"]
      },
      "web development": {
        definition: "Web Development is creating interactive websites and applications using HTML, CSS, JavaScript, and modern frameworks",
        difficultyLevel: "Intermediate",
        timeInvestment: "6-9 months",
        careerProspects: "Excellent - Stable with continuous evolution of technologies",
        industryAdoption: 88,
        topJobRoles: ["Frontend Developer", "Full-Stack Developer", "UI/UX Developer"],
        keySkills: ["React/Vue/Angular", "JavaScript", "CSS", "Node.js", "REST APIs"]
      },
      "react": {
        definition: "React is a JavaScript library for building dynamic user interfaces with component-based architecture",
        difficultyLevel: "Intermediate",
        timeInvestment: "4-7 months",
        careerProspects: "Very High - React is the most popular frontend framework",
        industryAdoption: 89,
        topJobRoles: ["React Developer", "Frontend Engineer", "Full-Stack Engineer"],
        keySkills: ["JavaScript ES6+", "JSX", "State Management", "Next.js", "Testing"]
      },
      "cloud computing": {
        definition: "Cloud Computing involves managing and deploying applications on cloud platforms like AWS, Azure, Google Cloud",
        difficultyLevel: "Advanced",
        timeInvestment: "5-10 months",
        careerProspects: "Excellent - Enterprise demand is very high",
        industryAdoption: 91,
        topJobRoles: ["Cloud Architect", "DevOps Engineer", "Cloud Engineer"],
        keySkills: ["AWS/Azure/GCP", "Docker", "Kubernetes", "Infrastructure as Code", "CI/CD"]
      },
      "aws": {
        definition: "AWS (Amazon Web Services) is the leading cloud platform offering compute, storage, database, and AI services",
        difficultyLevel: "Advanced",
        timeInvestment: "5-9 months",
        careerProspects: "Very High - Most enterprises use AWS for cloud infrastructure",
        industryAdoption: 88,
        topJobRoles: ["AWS Solutions Architect", "DevOps Engineer", "Cloud Engineer"],
        keySkills: ["EC2", "S3", "Lambda", "RDS", "VPC", "IAM"]
      },
      "ai": {
        definition: "Artificial Intelligence encompasses machine learning, deep learning, NLP, and computer vision for intelligent systems",
        difficultyLevel: "Advanced",
        timeInvestment: "10-18 months",
        careerProspects: "Excellent - Emerging field with cutting-edge research opportunities",
        industryAdoption: 96,
        topJobRoles: ["AI Engineer", "Research Scientist", "NLP Specialist"],
        keySkills: ["Transformers", "LLMs", "RAG", "Fine-tuning", "Prompt Engineering"]
      },
      "devops": {
        definition: "DevOps combines development and operations to automate software delivery, infrastructure, and monitoring",
        difficultyLevel: "Advanced",
        timeInvestment: "6-10 months",
        careerProspects: "Very High - Critical for modern software development",
        industryAdoption: 87,
        topJobRoles: ["DevOps Engineer", "Site Reliability Engineer", "Infrastructure Engineer"],
        keySkills: ["Docker", "Kubernetes", "Terraform", "Jenkins", "Monitoring Tools"]
      },
      "javascript": {
        definition: "JavaScript is the programming language that powers interactive web applications on both frontend and backend",
        difficultyLevel: "Beginner",
        timeInvestment: "4-6 months",
        careerProspects: "Excellent - Essential skill for web development",
        industryAdoption: 90,
        topJobRoles: ["JavaScript Developer", "Frontend Developer", "Full-Stack Developer"],
        keySkills: ["ES6+", "Node.js", "Express", "TypeScript", "Async/Await"]
      }
    };

    for (const courseName of courseNames) {
      const lower = courseName.toLowerCase();
      courseComparison[lower] = courseData[lower] || {
        definition: `${courseName} is a specialized skill in demand across the tech industry`,
        difficultyLevel: "Intermediate",
        timeInvestment: "6 months",
        careerProspects: "Good - Growing opportunities in the market",
        industryAdoption: 75,
        topJobRoles: [`${courseName} Specialist`, `${courseName} Engineer`, "Tech Professional"],
        keySkills: ["Problem Solving", "Communication", "Continuous Learning", "Teamwork"]
      };
    }

    // Generate comparison winners
    const insights = Object.values(courseInsights);
    const avgDemands = Object.entries(courseComparison).map(([name, data]) => ({
      name,
      adoption: data.industryAdoption
    })).sort((a, b) => b.adoption - a.adoption);

    return {
      courses: courseComparison,
      comparison: {
        easiestToLearn: courseNames.find(n => courseComparison[n.toLowerCase()].difficultyLevel === "Beginner") || courseNames[0],
        bestForStartups: avgDemands[0]?.name || courseNames[0],
        bestForEnterprise: avgDemands[1]?.name || courseNames[1] || courseNames[0],
        fastestROI: courseNames[0],
        bestForRemoteWork: courseNames[Math.floor(courseNames.length / 2)],
        overallBest: avgDemands[0]?.name || courseNames[0]
      },
      summary: `Comparison of ${courseNames.length} courses with demand scores, difficulty levels, and career prospects`
    };
  }

  /**
   * Calculate course rankings based on market data
   */
  static calculateRankings(courseInsights, comparison) {
    const rankings = [];

    for (const [courseName, insights] of Object.entries(courseInsights)) {
      const score = this.calculateCourseScore(insights, comparison.courses?.[courseName]);
      rankings.push({
        name: courseName,
        score,
        demand: insights.demand?.demandScore || 75,
        salary: insights.salary?.averageExperiencedINR || 1000000,
        trending: insights.trends?.trendingScore || 70,
        growth: insights.growthMetrics?.demandGrowth5Year || 100
      });
    }

    return rankings.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate overall course score (0-100)
   */
  static calculateCourseScore(insights, comparisonData) {
    let score = 50;

    // Demand score (0-30 points)
    const demand = insights.demand?.demandScore || 70;
    score += (demand / 100) * 30;

    // Trending score (0-20 points)
    const trending = insights.trends?.trendingScore || 70;
    score += (trending / 100) * 20;

    // Growth metrics (0-20 points)
    const growth = Math.min(100, insights.growthMetrics?.demandGrowth5Year || 100);
    score += (growth / 100) * 20;

    // Salary expectation (0-20 points)
    const salary = insights.salary?.averageExperiencedINR || 1000000;
    const salaryScore = Math.min(100, (salary / 2000000) * 100);
    score += (salaryScore / 100) * 20;

    // Difficulty adjustment (negative for very difficult)
    if (comparisonData?.difficultyLevel === "Advanced") {
      score -= 5;
    } else if (comparisonData?.difficultyLevel === "Beginner") {
      score += 3;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Generate best recommendation with reasoning
   */
  static generateRecommendation(rankings, courseInsights, comparison) {
    if (rankings.length === 0) return null;

    const best = rankings[0];
    const bestInsights = courseInsights[best.name];
    const comparisonData = comparison.courses?.[best.name];

    return {
      recommendedCourse: best.name,
      reason: `${best.name} is the best choice with an overall score of ${best.score}/100`,
      keyStrengths: [
        `High demand score: ${best.demand}/100`,
        `Strong trending: ${best.trending}/100`,
        `Growth potential: ${best.growth}% over 5 years`,
        `Competitive salary: ₹${(best.salary / 100000).toFixed(1)} lakhs`
      ],
      summary: comparisonData?.definition || "Leading course in the market",
      careersAvailable: comparisonData?.topJobRoles || ["Professional roles available"],
      skillsToFocus: comparisonData?.keySkills || ["Core skills required"],
      timeToLearn: comparisonData?.timeInvestment || "6-8 months",
      difficulty: comparisonData?.difficultyLevel || "Intermediate",
      investmentLevel: this.getInvestmentLevel(best.salary),
      futureOutlook: `${best.growth}% growth expected in 5 years`
    };
  }

  /**
   * Generate default insights for unknown courses
   */
  static generateDefaultInsights(courseName) {
    return {
      courseName: courseName.toLowerCase(),
      trends: { trendingScore: 70, yoyGrowth: 20, jobTrendDirection: "Stable" },
      demand: { demandScore: 75, openPositions: 5000, futureOutlook6Months: "Medium" },
      salary: { averageBeginnerINR: 600000, averageExperiencedINR: 1200000, salaryGrowthPercent: 15 },
      topCompanies: ["Tech Companies", "Startups", "Enterprise"],
      topIndustries: ["Technology", "Finance", "Healthcare"],
      relatedSkills: ["Problem Solving", "Communication", "Learning Attitude"],
      growthMetrics: { demandGrowth5Year: 100, salaryGrowth5Year: 80, jobsGrowth5Year: 120 },
      lastUpdated: new Date(),
      dataSource: "Default Configuration"
    };
  }

  /**
   * Determine investment level based on salary
   */
  static getInvestmentLevel(salary) {
    if (salary < 800000) return "Low Investment, High Returns";
    if (salary < 1200000) return "Moderate Investment, Good Returns";
    if (salary < 1600000) return "Good Investment, Strong Returns";
    return "High Investment, Excellent Long-term Returns";
  }
}

export default CourseComparisonService;
