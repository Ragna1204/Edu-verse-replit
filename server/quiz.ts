import { db } from "./db";
import {
  quizzes,
  questions,
  userQuizSessions,
  quizAttempts,
  users,
  quizDifficultyEnum,
} from "../shared/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { getGeminiResponse } from "./services/gemini";
import { storage } from "./storage";

// Function to start a quiz
export async function startQuiz(quizId: string, userId: string) {
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
  });

  if (!quiz) {
    throw new Error("Quiz not found.");
  }

  const firstQuestion = await db.query.questions.findFirst({
    where: and(eq(questions.courseId, quiz.courseId), eq(questions.difficulty, 'easy')),
  });

  if (!firstQuestion) {
    throw new Error("No questions found for this quiz.");
  }

  const newSession = await db
    .insert(userQuizSessions)
    .values({
      userId,
      quizId,
      currentQuestionId: firstQuestion.id,
      performanceHistory: [],
    })
    .returning();

  return { session: newSession[0], question: firstQuestion };
}

// Function to submit an answer
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  selectedOption: any
) {
  const session = await db.query.userQuizSessions.findFirst({
    where: eq(userQuizSessions.id, sessionId),
  });

  if (!session) {
    throw new Error("Quiz session not found.");
  }

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question) {
    throw new Error("Question not found.");
  }

  const correctOption = (question.options as any[]).find(option => option.isCorrect);
  const isCorrect = correctOption.text === selectedOption.text;

  const updatedPerformanceHistory = [
    ...session.performanceHistory as any[],
    { questionId, isCorrect },
  ];

  const updatedScore = isCorrect ? (session.score || 0) + 10 : session.score;

  await db
    .update(userQuizSessions)
    .set({
      performanceHistory: updatedPerformanceHistory,
      score: updatedScore,
      updatedAt: new Date(),
    })
    .where(eq(userQuizSessions.id, sessionId));

  if (isCorrect) {
    await storage.updateUserXP(session.userId, 10);
  }

  return { isCorrect, correctOption, score: updatedScore };
}

// Function to get the next question
export async function getNextQuestion(sessionId: string) {
  const session = await db.query.userQuizSessions.findFirst({
    where: eq(userQuizSessions.id, sessionId),
    relations: true,
  });

  if (!session) {
    throw new Error("Quiz session not found.");
  }

  const lastAnswer = (session.performanceHistory as any[])[
    session.performanceHistory.length - 1
  ];
  const lastQuestion = await db.query.questions.findFirst({
    where: eq(questions.id, lastAnswer.questionId),
  });

  if (!lastQuestion) {
    throw new Error("Last question not found");
  }

  let nextDifficulty: 'easy' | 'medium' | 'hard';

  if (lastAnswer.isCorrect) {
    if (lastQuestion.difficulty === 'easy') nextDifficulty = 'medium';
    else if (lastQuestion.difficulty === 'medium') nextDifficulty = 'hard';
    else nextDifficulty = 'hard';
  } else {
    if (lastQuestion.difficulty === 'hard') nextDifficulty = 'medium';
    else if (lastQuestion.difficulty === 'medium') nextDifficulty = 'easy';
    else nextDifficulty = 'easy';
  }

  const answeredQuestionIds = (session.performanceHistory as any[]).map(
    (h) => h.questionId
  );

  const nextQuestion = await db.query.questions.findFirst({
    where: and(
      eq(questions.courseId, (session.quiz as any).courseId),
      eq(questions.difficulty, nextDifficulty),
      notInArray(questions.id, answeredQuestionIds)
    ),
  });

  if (nextQuestion) {
    await db
      .update(userQuizSessions)
      .set({ currentQuestionId: nextQuestion.id, updatedAt: new Date() })
      .where(eq(userQuizSessions.id, sessionId));
    return nextQuestion;
  } else {
    // If no more questions, end the quiz
    await db.delete(userQuizSessions).where(eq(userQuizSessions.id, sessionId));
    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, session.quizId) });
    const quizAttempt = {
      userId: session.userId,
      quizId: session.quizId,
      score: session.score,
      timeSpent: Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000),
      difficulty: quiz?.difficulty || 'medium',
      answers: session.performanceHistory,
      isPassed: session.score >= (quiz?.passingScore || 70),
    };
    await db.insert(quizAttempts).values(quizAttempt);
    await checkAndAwardBadges(session.userId, quizAttempt);
    return null;
  }
}

async function checkAndAwardBadges(userId: string, quizAttempt: any) {
  const allBadges = await storage.getBadges();
  const userBadges = await storage.getUserBadges(userId);
  const userBadgeIds = userBadges.map((b) => b.id);

  for (const badge of allBadges) {
    if (userBadgeIds.includes(badge.id)) {
      continue;
    }

    let shouldAward = false;
    const criteria = badge.criteria as any;

    if (criteria.type === 'first_quiz') {
      const userAttempts = await storage.getUserQuizAttempts(userId);
      if (userAttempts.length === 1) {
        shouldAward = true;
      }
    } else if (criteria.type === 'perfect_score') {
      if (quizAttempt.score === 100) {
        shouldAward = true;
      }
    } else if (criteria.type === 'streak') {
      const user = await storage.getUser(userId);
      if (user && user.streak >= criteria.days) {
        shouldAward = true;
      }
    }

    if (shouldAward) {
      await storage.awardBadge(userId, badge.id);
    }
  }
}