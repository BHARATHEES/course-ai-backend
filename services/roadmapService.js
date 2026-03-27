import fetch from "node-fetch";

/**
 * Roadmap Service
 * Generates comprehensive learning roadmaps for courses using HuggingFace AI
 * Shows step-by-step learning path from beginner to advanced
 */

class RoadmapService {
  /**
   * Generate a complete learning roadmap for a course
   * Returns structured steps, resources, timeline, and prerequisites
   */
  static async generateLearningRoadmap(courseName) {
    try {
      const startTime = Date.now();
      console.log(`🗺️ Generating learning roadmap for: ${courseName}`);

      // Try HuggingFace API first
      try {
        console.log(`🔄 Attempting HuggingFace API for roadmap...`);
        const roadmap = await this.generateRoadmapWithHF(courseName);
        console.log(`✅ HuggingFace roadmap generated (${Date.now() - startTime}ms)`);
        return roadmap;
      } catch (hfError) {
        console.warn(`⚠️ HuggingFace unavailable, using structured fallback: ${hfError.message}`);
        return this.generateStructuredRoadmap(courseName);
      }
    } catch (error) {
      console.error(`❌ Error generating roadmap:`, error.message);
      return this.generateStructuredRoadmap(courseName);
    }
  }

  /**
   * Call HuggingFace API to generate roadmap with AI
   */
  static async generateRoadmapWithHF(courseName) {
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) throw new Error("HF_API_KEY not configured");

    const prompt = `Create a comprehensive learning roadmap for "${courseName}". Return ONLY valid JSON with this exact structure:
{
  "courseName": "${courseName}",
  "overview": "Brief overview of what will be learned",
  "totalDurationWeeks": number,
  "difficulty": "Beginner/Intermediate/Advanced",
  "prerequisites": ["prereq1", "prereq2"],
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Phase name",
      "duration": "X weeks",
      "goals": ["goal1", "goal2"],
      "topics": ["topic1", "topic2"],
      "resources": [
        {
          "type": "video/course/book/documentation",
          "title": "Resource title",
          "platform": "Platform name",
          "estimatedHours": number,
          "difficulty": "Easy/Medium/Hard"
        }
      ],
      "projects": ["Build a simple project", "Advanced project"],
      "keySkills": ["skill1", "skill2"]
    }
  ],
  "milestones": [
    {
      "week": number,
      "milestone": "Milestone description",
      "expectedOutcome": "What you should be able to do"
    }
  ],
  "careerPath": {
    "jobTitles": ["job1", "job2"],
    "avgSalaryINR": "Range as string",
    "demandLevel": "High/Medium/Low",
    "topCompanies": ["company1", "company2"]
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "commonChallenges": ["Challenge 1", "Challenge 2"],
  "nextSteps": ["After mastery, learn X", "Combine with Y"]
}`;

    console.log(`🌐 Calling HuggingFace API for roadmap...`);

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert learning path designer. Return ONLY valid JSON, no markdown.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2500,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    console.log(`📡 HuggingFace Response Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid HuggingFace response format");
    }

    const content = data.choices[0].message.content;
    console.log(`📝 Raw response (first 200 chars): ${content.substring(0, 200)}`);

    // Try to extract JSON
    let roadmapData;
    try {
      // Check if response contains JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      roadmapData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON: ${parseError.message}`);
      throw new Error(`Invalid JSON in HuggingFace response: ${parseError.message}`);
    }

    return {
      success: true,
      source: "huggingface",
      data: roadmapData,
      generatedAt: new Date(),
    };
  }

  /**
   * Structured fallback roadmap generator
   * Creates a realistic learning path based on course category
   */
  static generateStructuredRoadmap(courseName) {
    const courseLower = courseName.toLowerCase();

    // Determine course category
    let category = "general";
    if (
      courseLower.includes("python") ||
      courseLower.includes("javascript") ||
      courseLower.includes("java")
    ) {
      category = "programming";
    } else if (
      courseLower.includes("react") ||
      courseLower.includes("angular") ||
      courseLower.includes("vue")
    ) {
      category = "frontend";
    } else if (
      courseLower.includes("node") ||
      courseLower.includes("express") ||
      courseLower.includes("backend")
    ) {
      category = "backend";
    } else if (
      courseLower.includes("machine learning") ||
      courseLower.includes("deep learning") ||
      courseLower.includes("ai")
    ) {
      category = "machine_learning";
    } else if (
      courseLower.includes("data") ||
      courseLower.includes("sql") ||
      courseLower.includes("database")
    ) {
      category = "data";
    } else if (
      courseLower.includes("cloud") ||
      courseLower.includes("aws") ||
      courseLower.includes("azure")
    ) {
      category = "cloud";
    } else if (
      courseLower.includes("devops") ||
      courseLower.includes("docker") ||
      courseLower.includes("kubernetes")
    ) {
      category = "devops";
    }

    const roadmaps = {
      programming: {
        courseName,
        overview: `Master ${courseName} programming language with practical projects and real-world applications`,
        totalDurationWeeks: 12,
        difficulty: "Beginner",
        prerequisites: ["Basic computer literacy", "Understanding of problem-solving"],
        phases: [
          {
            phaseNumber: 1,
            phaseName: "Foundations & Syntax",
            duration: "3 weeks",
            goals: [
              "Understand language basics and syntax",
              "Learn about variables and data types",
              "Master control flow and loops",
            ],
            topics: ["Variables", "Data Types", "Operators", "Control Flow", "Functions"],
            resources: [
              {
                type: "video",
                title: `${courseName} Basics Tutorial`,
                platform: "Udemy/YouTube",
                estimatedHours: 15,
                difficulty: "Easy",
              },
              {
                type: "documentation",
                title: "Official Documentation",
                platform: "Official Site",
                estimatedHours: 10,
                difficulty: "Medium",
              },
            ],
            projects: ["Build calculator app", "Create a to-do list"],
            keySkills: ["Syntax", "Logic", "Debugging"],
          },
          {
            phaseNumber: 2,
            phaseName: "Object-Oriented Programming",
            duration: "3 weeks",
            goals: [
              "Understand OOP principles",
              "Work with classes and objects",
              "Master inheritance and polymorphism",
            ],
            topics: ["Classes", "Objects", "Inheritance", "Polymorphism", "Encapsulation"],
            resources: [
              {
                type: "course",
                title: "OOP Mastery Course",
                platform: "Coursera/Udemy",
                estimatedHours: 20,
                difficulty: "Medium",
              },
            ],
            projects: ["Design a library management system", "Build a game with OOP"],
            keySkills: ["OOP Design", "Architecture", "Patterns"],
          },
          {
            phaseNumber: 3,
            phaseName: "Advanced Topics & Real Projects",
            duration: "6 weeks",
            goals: [
              "Master advanced features",
              "Build production-ready applications",
              "Learn best practices and design patterns",
            ],
            topics: [
              "Async Programming",
              "Error Handling",
              "Testing",
              "Design Patterns",
              "Performance",
            ],
            resources: [
              {
                type: "book",
                title: "Clean Code & Design Patterns",
                platform: "Various",
                estimatedHours: 30,
                difficulty: "Hard",
              },
            ],
            projects: [
              "Build a full-scale web application",
              "Contribute to open-source projects",
            ],
            keySkills: [
              "Advanced Patterns",
              "System Design",
              "Code Quality",
              "Performance Optimization",
            ],
          },
        ],
        milestones: [
          {
            week: 2,
            milestone: "Complete first program",
            expectedOutcome: "You can write basic programs without reference",
          },
          {
            week: 6,
            milestone: "Master OOP",
            expectedOutcome: "You can design and implement OOP solutions",
          },
          {
            week: 12,
            milestone: "Build complex application",
            expectedOutcome: "You can build production-ready applications",
          },
        ],
        careerPath: {
          jobTitles: ["Software Developer", "Web Developer", "Full Stack Engineer"],
          avgSalaryINR: "₹8-15 LPA",
          demandLevel: "High",
          topCompanies: ["Google", "Microsoft", "Amazon", "Flipkart", "Infosys"],
        },
        tips: [
          "Practice coding daily - consistency is key",
          "Build projects to reinforce learning",
          "Read other people's code to improve style",
          "Join developer communities for support",
          "Contribute to open-source projects",
        ],
        commonChallenges: [
          "Debugging complex issues",
          "Understanding advanced concepts",
          "Designing scalable systems",
          "Performance optimization",
        ],
        nextSteps: [
          "Learn a web framework (Django, Flask, etc.)",
          "Study databases and SQL",
          "Explore cloud platforms",
          "Master system design",
        ],
      },
      frontend: {
        courseName,
        overview: `Become a proficient ${courseName} frontend developer with modern UI/UX principles`,
        totalDurationWeeks: 10,
        difficulty: "Intermediate",
        prerequisites: ["HTML", "CSS", "JavaScript basics"],
        phases: [
          {
            phaseNumber: 1,
            phaseName: "Framework Fundamentals",
            duration: "3 weeks",
            goals: [
              "Understand framework architecture",
              "Learn component-based development",
              "Master state management basics",
            ],
            topics: ["Components", "State", "Props", "Hooks", "Lifecycle"],
            resources: [
              {
                type: "course",
                title: `${courseName} Essentials`,
                platform: "Udemy/Pluralsight",
                estimatedHours: 20,
                difficulty: "Medium",
              },
            ],
            projects: ["Build a TODO app", "Create a weather app"],
            keySkills: ["Component Design", "State Management", "Event Handling"],
          },
          {
            phaseNumber: 2,
            phaseName: "Advanced Patterns & Performance",
            duration: "4 weeks",
            goals: [
              "Master advanced state management",
              "Optimize performance",
              "Learn routing and navigation",
            ],
            topics: [
              "Redux/Context",
              "Performance",
              "Routing",
              "API Integration",
              "Testing",
            ],
            resources: [
              {
                type: "course",
                title: "Advanced Frontend Patterns",
                platform: "Frontend Masters",
                estimatedHours: 25,
                difficulty: "Hard",
              },
            ],
            projects: [
              "Build a social media dashboard",
              "Create an e-commerce site",
            ],
            keySkills: [
              "State Management Patterns",
              "Performance Optimization",
              "API Integration",
            ],
          },
          {
            phaseNumber: 3,
            phaseName: "Production & Deployment",
            duration: "3 weeks",
            goals: [
              "Deploy applications",
              "Implement CI/CD",
              "Monitor and debug production",
            ],
            topics: ["Build Tools", "Testing", "Deployment", "Monitoring"],
            resources: [
              {
                type: "documentation",
                title: "Deployment Guides",
                platform: "Official Docs",
                estimatedHours: 15,
                difficulty: "Medium",
              },
            ],
            projects: ["Deploy a full-featured application"],
            keySkills: ["Deployment", "Debugging", "DevOps Basics"],
          },
        ],
        milestones: [
          {
            week: 3,
            milestone: "First interactive app",
            expectedOutcome: "Understand component lifecycle",
          },
          {
            week: 7,
            milestone: "Complex state management",
            expectedOutcome: "Handle complex application state",
          },
          {
            week: 10,
            milestone: "Production deployment",
            expectedOutcome: "Deploy apps to production",
          },
        ],
        careerPath: {
          jobTitles: [
            "Frontend Developer",
            "UI/UX Developer",
            "Full Stack Developer",
          ],
          avgSalaryINR: "₹10-18 LPA",
          demandLevel: "High",
          topCompanies: ["Google", "Facebook", "Amazon", "Netlify", "Vercel"],
        },
        tips: [
          "Build projects from scratch regularly",
          "Stay updated with framework changes",
          "Focus on user experience",
          "Learn CSS and accessibility",
          "Join frontend communities",
        ],
        commonChallenges: [
          "Managing complex state",
          "Performance optimization",
          "Cross-browser compatibility",
          "Accessibility implementation",
        ],
        nextSteps: [
          "Master backend integration",
          "Learn TypeScript",
          "Study system design",
          "Explore DevOps tools",
        ],
      },
      machine_learning: {
        courseName,
        overview: `Master ${courseName} and build intelligent systems with machine learning`,
        totalDurationWeeks: 16,
        difficulty: "Advanced",
        prerequisites: ["Python", "Mathematics", "Statistics"],
        phases: [
          {
            phaseNumber: 1,
            phaseName: "ML Fundamentals",
            duration: "4 weeks",
            goals: [
              "Understand ML concepts",
              "Learn supervised and unsupervised learning",
              "Master data preprocessing",
            ],
            topics: [
              "Supervised Learning",
              "Unsupervised Learning",
              "Data Preprocessing",
              "Feature Engineering",
            ],
            resources: [
              {
                type: "course",
                title: "Machine Learning Basics",
                platform: "Coursera/Andrew Ng",
                estimatedHours: 30,
                difficulty: "Medium",
              },
            ],
            projects: [
              "Predict house prices",
              "Iris flower classification",
            ],
            keySkills: ["Data Analysis", "Feature Engineering", "Model Selection"],
          },
          {
            phaseNumber: 2,
            phaseName: "Deep Learning & Neural Networks",
            duration: "5 weeks",
            goals: [
              "Master neural networks",
              "Learn deep learning",
              "Build CNN and RNN models",
            ],
            topics: [
              "Neural Networks",
              "CNN",
              "RNN",
              "TensorFlow",
              "PyTorch",
            ],
            resources: [
              {
                type: "course",
                title: "Deep Learning Specialization",
                platform: "Coursera",
                estimatedHours: 40,
                difficulty: "Hard",
              },
            ],
            projects: ["Image classification", "Text generation with RNN"],
            keySkills: [
              "Neural Net Design",
              "Computer Vision",
              "NLP Basics",
            ],
          },
          {
            phaseNumber: 3,
            phaseName: "Advanced & Production ML",
            duration: "7 weeks",
            goals: [
              "Deploy ML models",
              "Handle real-world data",
              "Optimize models for production",
            ],
            topics: [
              "Model Deployment",
              "MLOps",
              "Scaling",
              "A/B Testing",
              "Monitoring",
            ],
            resources: [
              {
                type: "course",
                title: "MLOps and Production ML",
                platform: "Coursera/DataCamp",
                estimatedHours: 35,
                difficulty: "Hard",
              },
            ],
            projects: [
              "End-to-end ML pipeline",
              "Deploy model to production",
            ],
            keySkills: [
              "MLOps",
              "Deployment",
              "Monitoring",
              "Optimization",
            ],
          },
        ],
        milestones: [
          {
            week: 4,
            milestone: "First ML model",
            expectedOutcome: "Understand ML workflow",
          },
          {
            week: 9,
            milestone: "Deep learning model",
            expectedOutcome: "Build neural networks",
          },
          {
            week: 16,
            milestone: "Production ML system",
            expectedOutcome: "Deploy models at scale",
          },
        ],
        careerPath: {
          jobTitles: [
            "ML Engineer",
            "Data Scientist",
            "AI Research Engineer",
          ],
          avgSalaryINR: "₹15-30 LPA",
          demandLevel: "High",
          topCompanies: ["Google", "DeepMind", "Tesla", "OpenAI", "Microsoft"],
        },
        tips: [
          "Focus on mathematics and statistics",
          "Practice with real datasets",
          "Participate in Kaggle competitions",
          "Stay updated with research papers",
          "Collaborate on research projects",
        ],
        commonChallenges: [
          "Understanding complex mathematics",
          "Working with large datasets",
          "Model optimization",
          "Handling imbalanced data",
        ],
        nextSteps: [
          "Specialize in Computer Vision or NLP",
          "Learn about reinforcement learning",
          "Study advanced architectures",
          "Contribute to open-source ML projects",
        ],
      },
      general: {
        courseName,
        overview: `Complete learning roadmap for mastering ${courseName}`,
        totalDurationWeeks: 12,
        difficulty: "Beginner",
        prerequisites: ["Basic computer knowledge"],
        phases: [
          {
            phaseNumber: 1,
            phaseName: "Introduction & Basics",
            duration: "3 weeks",
            goals: [
              "Understand core concepts",
              "Learn fundamental principles",
              "Get hands-on experience",
            ],
            topics: [
              "Basic concepts",
              "Fundamental principles",
              "Industry standards",
            ],
            resources: [
              {
                type: "course",
                title: `${courseName} Fundamentals`,
                platform: "Udemy/Coursera",
                estimatedHours: 20,
                difficulty: "Easy",
              },
            ],
            projects: ["Learn by doing simple projects"],
            keySkills: ["Fundamentals", "Practice", "Problem-solving"],
          },
          {
            phaseNumber: 2,
            phaseName: "Intermediate Concepts",
            duration: "4 weeks",
            goals: [
              "Go deeper into concepts",
              "Learn advanced techniques",
              "Build complex projects",
            ],
            topics: [
              "Advanced concepts",
              "Best practices",
              "Real-world applications",
            ],
            resources: [
              {
                type: "course",
                title: "Advanced Techniques",
                platform: "Pluralsight/LinkedIn Learning",
                estimatedHours: 25,
                difficulty: "Medium",
              },
            ],
            projects: ["Build intermediate projects"],
            keySkills: ["Advanced techniques", "Architecture", "Optimization"],
          },
          {
            phaseNumber: 3,
            phaseName: "Mastery & Specialization",
            duration: "5 weeks",
            goals: [
              "Achieve mastery level",
              "Specialize in areas",
              "Lead projects",
            ],
            topics: [
              "Specializations",
              "Leadership",
              "Industry best practices",
            ],
            resources: [
              {
                type: "book",
                title: "Advanced Topics",
                platform: "Various Publishers",
                estimatedHours: 30,
                difficulty: "Hard",
              },
            ],
            projects: [
              "Lead complex project",
              "Mentor others",
            ],
            keySkills: [
              "Mastery",
              "Leadership",
              "Innovation",
              "Mentoring",
            ],
          },
        ],
        milestones: [
          {
            week: 3,
            milestone: "Understand fundamentals",
            expectedOutcome: "Ready to build basic projects",
          },
          {
            week: 7,
            milestone: "Intermediate competency",
            expectedOutcome: "Handle complex scenarios",
          },
          {
            week: 12,
            milestone: "Expert level",
            expectedOutcome: "Lead projects and mentor others",
          },
        ],
        careerPath: {
          jobTitles: ["Professional", "Expert", "Consultant"],
          avgSalaryINR: "₹8-20 LPA",
          demandLevel: "High",
          topCompanies: [
            "Top Tech Companies",
            "Leading Startups",
            "Enterprise Firms",
          ],
        },
        tips: [
          "Consistent practice is essential",
          "Build real-world projects",
          "Learn from mentors",
          "Join communities",
          "Stay updated with trends",
        ],
        commonChallenges: [
          "Staying motivated",
          "Handling complexity",
          "Time management",
          "Finding good resources",
        ],
        nextSteps: [
          "Explore related skills",
          "Specialize further",
          "Lead projects",
          "Mentor newcomers",
        ],
      },
    };

    const roadmap = roadmaps[category] || roadmaps.general;

    return {
      success: true,
      source: "structured",
      data: roadmap,
      generatedAt: new Date(),
    };
  }
}

export default RoadmapService;
