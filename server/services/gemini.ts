import { GoogleGenAI } from "@google/genai";

// the newest Gemini model is "gemini-2.5-flash" which was released August 7, 2025. do not change this unless explicitly requested by the user
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTutorResponse(question: string, context?: string): Promise<string> {
  const systemPrompt = `You are EduBot, an AI learning assistant for EduVerse, an educational platform. 
  You help students understand concepts, solve problems, and provide guidance. 
  Be encouraging, clear, and educational in your responses. 
  ${context ? `Context: ${context}` : ''}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
    },
    contents: question,
  });

  return response.text || "I'm sorry, I couldn't process that question. Could you please rephrase it?";
}

export async function generateQuizQuestions(topic: string, difficulty: 'easy' | 'medium' | 'hard', count: number = 5): Promise<any[]> {
  const prompt = `Generate ${count} multiple choice questions about ${topic} at ${difficulty} difficulty level.
  
  Return the response as a JSON array where each question object has:
  - question: the question text
  - options: array of 4 answer options (strings)
  - correctAnswer: index (0-3) of the correct option
  - explanation: brief explanation of the correct answer
  
  Make questions engaging and educational.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { 
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4
              },
              correctAnswer: { type: "number", minimum: 0, maximum: 3 },
              explanation: { type: "string" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      },
      contents: prompt,
    });

    const questions = JSON.parse(response.text || "[]");
    return questions;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error(`Failed to generate quiz questions: ${error}`);
  }
}

export async function provideLearningRecommendations(userProgress: any, weakAreas: string[]): Promise<string[]> {
  const prompt = `Based on a student's learning progress and weak areas, provide 3-4 specific learning recommendations.
  
  User Progress: ${JSON.stringify(userProgress)}
  Weak Areas: ${weakAreas.join(', ')}
  
  Return recommendations as a JSON array of strings. Each recommendation should be actionable and specific.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return ["Review fundamentals", "Practice more exercises", "Watch tutorial videos"];
  }
}

export async function adaptQuizDifficulty(previousAnswers: any[], currentDifficulty: string): Promise<'easy' | 'medium' | 'hard'> {
  const recentCorrect = previousAnswers.slice(-5).filter(a => a.correct).length;
  const accuracy = recentCorrect / Math.min(previousAnswers.length, 5);

  // Adaptive logic
  if (accuracy >= 0.8 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  } else if (accuracy <= 0.4 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }

  return currentDifficulty as 'easy' | 'medium' | 'hard';
}
