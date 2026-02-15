import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import { generateTutorResponse, generateQuizQuestions, provideLearningRecommendations, adaptQuizDifficulty } from "./services/gemini";
import { checkAndAwardBadges } from "./services/gamification";

// ----- Auth helpers -----
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

// Simple middleware to extract user ID from header or session
// For this project we use a lightweight approach: the client sends X-User-Id header
function getUserId(req: Request): string | null {
  // Priority: header > localStorage-synced userId
  const headerUserId = req.headers['x-user-id'] as string | undefined;
  if (headerUserId) return headerUserId;

  // Fallback: query param (for GET requests)
  const queryUserId = req.query.userId as string | undefined;
  if (queryUserId) return queryUserId;

  return null;
}

function requireAuth(req: Request, res: Response): string | null {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }
  return userId;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ==================== AUTH ROUTES ====================

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, password, firstName, lastName } = req.body;

      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ message: 'Invalid username format. Only letters, numbers, and underscores allowed.' });
      }
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: 'Username must be between 3 and 20 characters.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }

      // Check if username already exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
      }

      const passwordHash = hashPassword(password);
      const user = await storage.upsertUser({
        email: `${username}@eduverse.local`,
        firstName,
        lastName,
        username,
        passwordHash,
        role: 'student',
        isOnboarded: false,
        xp: 0,
        level: 1,
        streak: 0,
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isOnboarded: user.isOnboarded,
          role: user.role,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          isEducator: user.isEducator,
        }
      });
    } catch (error: any) {
      console.error('Signup error:', error.message);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Verify password
      if (user.passwordHash && !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Update last active
      await storage.updateUserStreak(user.id, user.streak || 0);

      res.json({
        message: 'Sign in successful',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isOnboarded: user.isOnboarded,
          grade: user.grade,
          board: user.board,
          subjects: user.subjects,
          role: user.role,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          isEducator: user.isEducator,
          profileImageUrl: user.profileImageUrl,
        }
      });
    } catch (error) {
      console.error('Error signing in:', error);
      res.status(500).json({ message: 'Failed to sign in' });
    }
  });

  app.get('/api/auth/user', async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.json(null);
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.json(null);
    }
    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isOnboarded: user.isOnboarded,
      grade: user.grade,
      board: user.board,
      subjects: user.subjects,
      role: user.role,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      isEducator: user.isEducator,
      profileImageUrl: user.profileImageUrl,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  // Update user onboarding data  
  app.put('/api/auth/onboard/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { grade, board, subjects } = req.body;

      await storage.updateUserOnboarding(userId, {
        grade,
        board,
        subjects,
        isOnboarded: true,
      });

      const updatedUser = await storage.getUser(userId);
      res.json({
        message: 'User onboarding completed successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating user onboarding:', error);
      res.status(500).json({ message: 'Failed to update user onboarding' });
    }
  });

  // ==================== COURSE ROUTES ====================

  app.get('/api/courses', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const courseList = await storage.getCourses(category);
      res.json(courseList);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const course = await storage.createCourse({
        ...req.body,
        educatorId: userId,
      });
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/courses/:id', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const course = await storage.updateCourse(req.params.id, req.body);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/courses/:id', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      await storage.deleteCourse(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  app.post('/api/courses/:id/enroll', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const enrollment = await storage.enrollUser(userId, req.params.id);

      // Award XP for enrollment
      await storage.updateUserXP(userId, 25);

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling:", error);
      res.status(500).json({ message: "Failed to enroll" });
    }
  });

  // ==================== ENROLLMENT ROUTES ====================

  app.get('/api/user/enrollments', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const userEnrollments = await storage.getUserEnrollments(userId);

      // Enrich with course data
      const enriched = await Promise.all(
        userEnrollments.map(async (enrollment) => {
          const course = await storage.getCourse(enrollment.courseId);
          return { ...enrollment, course };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.put('/api/user/enrollments/:courseId/progress', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const { progress, completedModules } = req.body;
      await storage.updateEnrollmentProgress(userId, req.params.courseId, progress, completedModules);

      // Award XP for progress
      if (progress > 0) {
        await storage.updateUserXP(userId, Math.floor(progress / 10));
      }

      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // ==================== QUIZ ROUTES ====================

  app.get('/api/courses/:courseId/quizzes', async (req, res) => {
    try {
      const quizList = await storage.getQuizzesByCourse(req.params.courseId);
      res.json(quizList);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/courses/:courseId/quizzes', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const quiz = await storage.createQuiz({
        ...req.body,
        courseId: req.params.courseId,
      });
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/quizzes/:id', async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Also get questions for the quiz
      const questionList = await storage.getQuestionsByQuiz(quiz.id);
      res.json({ ...quiz, questions: questionList });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.put('/api/quizzes/:id', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const quiz = await storage.updateQuiz(req.params.id, req.body);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.post('/api/quizzes/:quizId/attempt', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const attempt = await storage.submitQuizAttempt({
        ...req.body,
        userId,
        quizId: req.params.quizId,
      });

      // Check for badge awards
      try {
        await checkAndAwardBadges(userId, attempt);
      } catch (badgeError) {
        console.error("Error checking badges:", badgeError);
      }

      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get('/api/user/quiz-attempts', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const attempts = await storage.getUserQuizAttempts(userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // ==================== ADAPTIVE QUIZ ROUTES ====================

  app.post('/api/quizzes/:quizId/start', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const allQuestions = await storage.getQuestionsByQuiz(quiz.id);
      if (allQuestions.length === 0) {
        return res.status(400).json({ message: "Quiz has no questions" });
      }

      const session = await storage.createQuizSession({
        userId,
        quizId: quiz.id,
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: allQuestions.length,
        correctAnswers: 0,
        currentDifficulty: quiz.difficulty || 'easy',
        performanceHistory: [],
        isComplete: false,
      });

      // Return session with first question
      const firstQuestion = allQuestions[0];
      res.json({
        sessionId: session.id,
        question: {
          id: firstQuestion.id,
          content: firstQuestion.content,
          options: (firstQuestion.options as any[]).map((o: any) => o.text),
          difficulty: firstQuestion.difficulty,
        },
        questionNumber: 1,
        totalQuestions: allQuestions.length,
        timeLimit: quiz.timeLimit,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });

  app.post('/api/quizzes/sessions/:sessionId/submit', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const session = await storage.getQuizSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const { questionId, selectedOption } = req.body;

      // Get the question to check answer
      const allQuestions = await storage.getQuestionsByQuiz(session.quizId);
      const question = allQuestions.find(q => q.id === questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const options = question.options as any[];
      const isCorrect = options[selectedOption]?.isCorrect === true;

      // Update performance history
      const history = (session.performanceHistory as any[]) || [];
      history.push({ questionId, isCorrect });

      const newCorrectAnswers = (session.correctAnswers || 0) + (isCorrect ? 1 : 0);
      const nextIndex = (session.currentQuestionIndex || 0) + 1;
      const isComplete = nextIndex >= allQuestions.length;

      // Calculate score percentage
      const scorePercent = Math.round((newCorrectAnswers / allQuestions.length) * 100);

      // Adapt difficulty if adaptive
      let nextDifficulty = session.currentDifficulty || 'easy';
      if (!isComplete) {
        nextDifficulty = await adaptQuizDifficulty(history, nextDifficulty);
      }

      const updatedSession = await storage.updateQuizSession(session.id, {
        currentQuestionIndex: nextIndex,
        correctAnswers: newCorrectAnswers,
        score: scorePercent,
        performanceHistory: history,
        currentDifficulty: nextDifficulty,
        isComplete,
      });

      // Build response
      const response: any = {
        isCorrect,
        explanation: question.explanation,
        correctAnswer: options.findIndex((o: any) => o.isCorrect),
        score: scorePercent,
        isComplete,
      };

      if (isComplete) {
        // Submit as quiz attempt
        const quiz = await storage.getQuiz(session.quizId);
        const isPassed = scorePercent >= (quiz?.passingScore || 70);

        await storage.submitQuizAttempt({
          userId,
          quizId: session.quizId,
          answers: history,
          score: scorePercent,
          difficulty: session.currentDifficulty || 'easy',
          isPassed,
        });

        response.finalScore = scorePercent;
        response.totalQuestions = allQuestions.length;
        response.correctAnswers = newCorrectAnswers;
        response.isPassed = isPassed;
        response.passingScore = quiz?.passingScore || 70;
      } else {
        // Get next question
        const nextQuestion = allQuestions[nextIndex];
        response.nextQuestion = {
          id: nextQuestion.id,
          content: nextQuestion.content,
          options: (nextQuestion.options as any[]).map((o: any) => o.text),
          difficulty: nextQuestion.difficulty,
        };
        response.questionNumber = nextIndex + 1;
        response.totalQuestions = allQuestions.length;
      }

      res.json(response);
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(500).json({ message: "Failed to submit answer" });
    }
  });

  app.get('/api/quizzes/sessions/:sessionId/next', async (req, res) => {
    try {
      const session = await storage.getQuizSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.isComplete) {
        return res.json({ isComplete: true, score: session.score });
      }

      const allQuestions = await storage.getQuestionsByQuiz(session.quizId);
      const nextQuestion = allQuestions[session.currentQuestionIndex || 0];

      if (!nextQuestion) {
        return res.json({ isComplete: true, score: session.score });
      }

      res.json({
        question: {
          id: nextQuestion.id,
          content: nextQuestion.content,
          options: (nextQuestion.options as any[]).map((o: any) => o.text),
          difficulty: nextQuestion.difficulty,
        },
        questionNumber: (session.currentQuestionIndex || 0) + 1,
        totalQuestions: allQuestions.length,
      });
    } catch (error) {
      console.error("Error fetching next question:", error);
      res.status(500).json({ message: "Failed to fetch next question" });
    }
  });

  // ==================== BADGE ROUTES ====================

  app.get('/api/badges', async (req, res) => {
    try {
      const allBadges = await storage.getBadges();
      res.json(allBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/user/badges', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const userBadgeList = await storage.getUserBadges(userId);
      res.json(userBadgeList);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // ==================== LEADERBOARD ROUTES ====================

  app.get('/api/leaderboard', async (req, res) => {
    try {
      const timeFrame = (req.query.timeFrame as string || 'alltime') as 'weekly' | 'monthly' | 'alltime';
      const limit = parseInt(req.query.limit as string || '50', 10);
      const leaderboardUsers = await storage.getLeaderboard(timeFrame, limit);

      // Return sanitized user data (no password hashes)
      const sanitized = leaderboardUsers.map((u, index) => ({
        rank: index + 1,
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        profileImageUrl: u.profileImageUrl,
      }));

      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ==================== COMMUNITY ROUTES ====================

  app.get('/api/community/posts', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || '20', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const postList = await storage.getPosts(limit, offset);
      res.json(postList);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/community/posts', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const post = await storage.createPost({
        ...req.body,
        userId,
      });

      // Award XP for posting
      await storage.updateUserXP(userId, 10);

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/community/posts/:postId/like', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      await storage.likePost(userId, req.params.postId);
      res.json({ message: "Post liked successfully" });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // ==================== AI ROUTES ====================

  app.post('/api/ai/tutor', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const { question, context } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          response: "AI tutoring is currently unavailable. Please configure the GEMINI_API_KEY in your environment to enable AI features. In the meantime, here are some learning tips:\n\n1. Break down complex problems into smaller parts\n2. Practice regularly with examples\n3. Review your notes and try to explain concepts in your own words\n4. Use the quiz feature to test your understanding",
        });
      }

      const response = await generateTutorResponse(question, context);
      res.json({ response });
    } catch (error) {
      console.error("Error generating tutor response:", error);
      res.json({
        response: "I apologize, but I encountered an error processing your question. Please try again.",
      });
    }
  });

  app.post('/api/ai/generate-quiz', async (req, res) => {
    try {
      const { topic, difficulty, count } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          questions: [],
          message: "AI quiz generation requires a GEMINI_API_KEY. Use the existing quizzes instead.",
        });
      }

      const generatedQuestions = await generateQuizQuestions(topic, difficulty, count || 5);
      res.json({ questions: generatedQuestions });
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz questions" });
    }
  });

  app.post('/api/ai/conversations', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const conversation = await storage.saveConversation({
        ...req.body,
        userId,
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error saving conversation:", error);
      res.status(500).json({ message: "Failed to save conversation" });
    }
  });

  app.get('/api/user/conversations', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/ai/recommendations', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          recommendations: [
            "Review your recent quiz results and focus on weaker areas",
            "Try completing at least one quiz per day to maintain your streak",
            "Explore new courses in subjects you find interesting",
            "Use the AI tutor to get personalized explanations",
          ],
        });
      }

      const attempts = await storage.getUserQuizAttempts(userId);
      const weakAreas = attempts
        .filter(a => a.score < 70)
        .map(a => a.difficulty);

      const recommendations = await provideLearningRecommendations(
        { attempts: attempts.length, averageScore: attempts.reduce((s, a) => s + a.score, 0) / (attempts.length || 1) },
        weakAreas.length > 0 ? weakAreas : ['general']
      );

      res.json({ recommendations });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.json({
        recommendations: [
          "Keep practicing regularly",
          "Focus on understanding core concepts",
          "Review mistakes from past quizzes",
        ],
      });
    }
  });

  // ==================== ANALYTICS ROUTES ====================

  app.get('/api/user/analytics', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const days = parseInt(req.query.days as string || '30', 10);
      const analytics = await storage.getUserAnalytics(userId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/user/recent-activity', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const activity = await storage.getRecentActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get('/api/user/analytics/summary', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const days = parseInt(req.query.days as string || '30', 10);
      const summary = await storage.getAnalyticsSummary(userId, days);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/user/analytics/accuracy-by-topic', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const accuracy = await storage.getAccuracyRatePerTopic(userId);
      res.json(accuracy);
    } catch (error) {
      console.error("Error fetching accuracy:", error);
      res.status(500).json({ message: "Failed to fetch accuracy data" });
    }
  });

  // ==================== EDUCATOR ROUTES ====================

  app.get('/api/educator/courses', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const educatorCourses = await storage.getEducatorCourses(userId);
      res.json(educatorCourses);
    } catch (error) {
      console.error("Error fetching educator courses:", error);
      res.status(500).json({ message: "Failed to fetch educator courses" });
    }
  });

  app.get('/api/educator/quizzes', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const educatorQuizzes = await storage.getEducatorQuizzes(userId);
      res.json(educatorQuizzes);
    } catch (error) {
      console.error("Error fetching educator quizzes:", error);
      res.status(500).json({ message: "Failed to fetch educator quizzes" });
    }
  });

  // ==================== XP & STREAK ROUTES ====================

  app.post('/api/user/xp', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const { xp } = req.body;
      await storage.updateUserXP(userId, xp);

      const user = await storage.getUser(userId);
      res.json({ message: "XP updated successfully", xp: user?.xp, level: user?.level });
    } catch (error) {
      console.error("Error updating XP:", error);
      res.status(500).json({ message: "Failed to update XP" });
    }
  });

  app.post('/api/user/streak', async (req, res) => {
    try {
      const userId = requireAuth(req, res);
      if (!userId) return;

      const { streak } = req.body;
      await storage.updateUserStreak(userId, streak);
      res.json({ message: "Streak updated successfully" });
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // ==================== DB TEST ROUTE ====================

  app.get('/api/test-db', async (req, res) => {
    try {
      const allBadges = await storage.getBadges();
      const allCourses = await storage.getCourses();
      res.json({
        status: 'Database connected successfully',
        badges: allBadges.length,
        courses: allCourses.length,
        databasePath: process.env.DATABASE_URL,
      });
    } catch (error: any) {
      console.error('Database test failed:', error);
      res.status(500).json({
        error: 'Database test failed',
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
