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
  const recentCorrect = previousAnswers.slice(-5).filter(a => a.isCorrect).length;
  const accuracy = recentCorrect / Math.min(previousAnswers.length, 5);

  // Adaptive logic
  if (accuracy >= 0.8 && currentDifficulty !== 'hard') {
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  } else if (accuracy <= 0.4 && currentDifficulty !== 'easy') {
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }

  return currentDifficulty as 'easy' | 'medium' | 'hard';
}

// Generate full course content (readings + quizzes) for a given topic
export interface GeneratedLesson {
  title: string;
  type: 'reading' | 'quiz';
  content: string; // markdown for readings, JSON string of MCQs for quizzes
  estimatedMinutes: number;
  xpReward: number;
}

export async function generateCourseContent(
  topic: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  lessonCount: number = 8
): Promise<GeneratedLesson[]> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set — returning fallback course content");
    return generateFallbackContent(topic, difficulty, lessonCount);
  }

  const readingCount = Math.ceil(lessonCount * 0.7); // ~70% readings
  const quizCount = lessonCount - readingCount;

  const prompt = `You are creating educational course content for a ${difficulty}-level course about "${topic}".

Generate exactly ${readingCount} reading lessons and ${quizCount} quiz lessons. Alternate between readings and quizzes (e.g., 2-3 readings → 1 quiz → 2-3 readings → 1 quiz).

Return a JSON array of lesson objects in order. Each object must have:
- "title": string (descriptive lesson title)
- "type": either "reading" or "quiz"
- "estimatedMinutes": number (5-15 for readings, 10-15 for quizzes)

For "reading" type lessons:
- "content": A comprehensive markdown-formatted lesson (600-1000 words). Include:
  - Clear headings (##, ###)
  - Key concepts explained simply
  - Real-world examples
  - Code snippets if the topic involves programming (use \`\`\`language blocks)
  - Bold key terms
  - Bullet points for lists

For "quiz" type lessons:
- "content": A JSON string containing an array of 5 MCQ objects. Each MCQ must have:
  - "question": string
  - "options": array of 4 objects, each with "text" (string) and "isCorrect" (boolean) — exactly one must be correct
  - "explanation": string explaining the correct answer

Make the content educational, accurate, and engaging. Progress from basic to more advanced concepts.
Return ONLY the JSON array, no other text.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const lessons: any[] = JSON.parse(text || "[]");

    return lessons.map((lesson, i) => ({
      title: lesson.title || `Lesson ${i + 1}`,
      type: lesson.type === 'quiz' ? 'quiz' : 'reading',
      content: lesson.type === 'quiz'
        ? (typeof lesson.content === 'string' ? lesson.content : JSON.stringify(lesson.content))
        : (lesson.content || ''),
      estimatedMinutes: lesson.estimatedMinutes || 10,
      xpReward: lesson.type === 'quiz' ? 15 : 5,
    }));
  } catch (error) {
    console.error("Error generating course content:", error);
    return generateFallbackContent(topic, difficulty, lessonCount);
  }
}

function generateFallbackContent(topic: string, difficulty: string, count: number): GeneratedLesson[] {
  const lessons: GeneratedLesson[] = [];
  let order = 0;

  // Generate reading lessons
  for (let i = 0; i < Math.ceil(count * 0.7); i++) {
    lessons.push({
      title: `${topic} - Part ${i + 1}`,
      type: 'reading',
      content: `## ${topic} - Part ${i + 1}\n\nThis lesson covers important concepts about **${topic}** at the **${difficulty}** level.\n\n### Key Concepts\n\n- Concept ${i * 3 + 1}: Understanding the fundamentals\n- Concept ${i * 3 + 2}: Applying knowledge in practice\n- Concept ${i * 3 + 3}: Advanced techniques and best practices\n\n### Summary\n\nIn this lesson, you learned about the core principles of ${topic}. These concepts form the foundation for more advanced topics covered later in the course.\n\n> **Note**: This is placeholder content. With a Gemini API key configured, you'll get comprehensive, AI-generated educational content.\n`,
      estimatedMinutes: 10,
      xpReward: 5,
    });
    order++;

    // Add quiz after every 2-3 readings
    if ((i + 1) % 3 === 0 || i === Math.ceil(count * 0.7) - 1) {
      const quizQuestions = [];
      for (let q = 0; q < 5; q++) {
        quizQuestions.push({
          question: `Sample question ${q + 1} about ${topic}`,
          options: [
            { text: "Correct answer", isCorrect: true },
            { text: "Wrong answer A", isCorrect: false },
            { text: "Wrong answer B", isCorrect: false },
            { text: "Wrong answer C", isCorrect: false },
          ],
          explanation: `This is the explanation for question ${q + 1}.`,
        });
      }
      lessons.push({
        title: `${topic} - Quiz ${Math.ceil(order / 3)}`,
        type: 'quiz',
        content: JSON.stringify(quizQuestions),
        estimatedMinutes: 10,
        xpReward: 15,
      });
      order++;
    }
  }

  return lessons;
}

