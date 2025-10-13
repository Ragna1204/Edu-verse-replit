import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateTutorResponse(question: string, context?: any[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are EduBot, an AI learning assistant for EduVerse, an educational platform. 
      You help students understand concepts, solve problems, and provide guidance. 
      Be encouraging, clear, and educational in your responses.`
    });

    const history = context?.map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    })) || [];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(question);
    const response = result.response;
    const text = response.text();

    return text || "I'm sorry, I couldn't process that question. Could you please rephrase it?";
  } catch (error) {
    console.error("Error generating tutor response:", error);
    return "I'm sorry, I encountered an error processing your question. Please try again.";
  }
}

export async function generateQuizQuestions(topic: string, difficulty: 'easy' | 'medium' | 'hard', count: number = 5): Promise<any[]> {
  const prompt = `Generate ${count} multiple choice questions about ${topic} at ${difficulty} difficulty level.
  
  Return the response as a JSON array where each question object has:
  - question: the question text
  - options: array of 4 answer options (strings)
  - correctAnswer: index (0-3) of the correct option
  - explanation: brief explanation of the correct answer
  
  Make questions engaging and educational. Format as valid JSON.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const questions = JSON.parse(text || "[]");
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
  
  Return recommendations as a JSON array of strings. Each recommendation should be actionable and specific. Format as valid JSON array.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return JSON.parse(text || "[]");
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
