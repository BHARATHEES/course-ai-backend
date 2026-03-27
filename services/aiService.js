import fetch from "node-fetch";

/**
 * Connects to Hugging Face AI to analyze course data
 */
export const analyzeCourse = async (courseName) => {
  try {
    
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct",
          messages: [
            { 
              role: "system", 
              content: "You are a career data expert. Return ONLY a valid JSON object. Do not include markdown formatting or extra text." 
            },
            { 
              role: "user", 
              content: `Analyze the course "${courseName}" and return this structure: 
              {
                "popularityScore": number (1-100),
                "marketDemand": "High" | "Medium" | "Low",
                "salaryPotential": { "entryLevel": number, "experienced": number },
                "learningDifficulty": "Beginner" | "Intermediate" | "Advanced",
                "summary": "string",
                "trendingScore": number
              }` 
            }
          ],
          response_format: { type: "json_object" }
        })
      }
    );

    if (!response.ok) throw new Error("AI API reached but failed");

    const data = await response.json();
    // Some AI models return stringified JSON inside the content field
    const analysis = typeof data.choices[0].message.content === 'string' 
      ? JSON.parse(data.choices[0].message.content) 
      : data.choices[0].message.content;

    return {
      isValid: true,
      analysis: { ...analysis, lastUpdated: new Date() },
      source: "huggingface-ai"
    };
  } catch (err) {
    console.error("AI Service Error:", err);
    return { isValid: false, source: "fallback-demo" };
  }
};
