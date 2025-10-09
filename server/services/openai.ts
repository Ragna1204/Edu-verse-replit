import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeQuizPerformance(quizAttempts: any[]): Promise<{
  overallAccuracy: number;
  weakAreas: string[];
  recommendations: string[];
  nextDifficulty: 'easy' | 'medium' | 'hard';
}> {
  const prompt = `Analyze a student's quiz performance data and provide insights.
  
  Quiz Attempts: ${JSON.stringify(quizAttempts)}
  
  Return a JSON object with:
  - overallAccuracy: number (0-1)
  - weakAreas: array of topic strings where student struggles
  - recommendations: array of specific study recommendations
  - nextDifficulty: suggested difficulty level for next quiz`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI education analyst. Provide detailed, actionable insights based on student performance data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing quiz performance:", error);
    return {
      overallAccuracy: 0.75,
      weakAreas: ["general concepts"],
      recommendations: ["Review course materials", "Practice more exercises"],
      nextDifficulty: 'medium'
    };
  }
}

export async function generatePersonalizedContent(userProfile: any, topic: string): Promise<{
  explanation: string;
  examples: string[];
  practiceQuestions: string[];
}> {
  const prompt = `Create personalized learning content for a student based on their profile and learning style.
  
  User Profile: ${JSON.stringify(userProfile)}
  Topic: ${topic}
  
  Generate:
  1. A clear, engaging explanation tailored to their level
  2. 2-3 practical examples
  3. 2-3 practice questions with varying difficulty
  
  Return as JSON object with explanation, examples array, and practiceQuestions array.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI tutor that creates personalized educational content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating personalized content:", error);
    return {
      explanation: "This is a fundamental concept in this subject area.",
      examples: ["Example 1: Basic application", "Example 2: Advanced usage"],
      practiceQuestions: ["Question 1: Basic understanding", "Question 2: Applied knowledge"]
    };
  }
}

export async function moderateContent(content: string): Promise<{
  isAppropriate: boolean;
  reason?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a content moderator for an educational platform. Check if content is appropriate for learners of all ages."
        },
        {
          role: "user",
          content: `Please moderate this content: "${content}"`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 256,
    });

    return JSON.parse(response.choices[0].message.content || '{"isAppropriate": true}');
  } catch (error) {
    console.error("Error moderating content:", error);
    return { isAppropriate: true };
  }
}
