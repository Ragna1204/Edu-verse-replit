import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateTutorResponse, generateQuizQuestions, provideLearningRecommendations, adaptQuizDifficulty } from "./services/gemini";
import { analyzeQuizPerformance, generatePersonalizedContent, moderateContent } from "./services/openai";
import { insertCourseSchema, insertEnrollmentSchema, insertQuizSchema, insertQuizAttemptSchema, insertPostSchema, insertAiConversationSchema } from "@shared/schema";
import { z } from "zod";
import { startQuiz, submitAnswer, getNextQuestion } from "./quiz";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
        lastActive?.setHours(0, 0, 0, 0);

        if (!lastActive || lastActive.getTime() < today.getTime()) {
          // User was not active today
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          if (lastActive && lastActive.getTime() === yesterday.getTime()) {
            // Active yesterday, increment streak
            await storage.updateUserStreak(userId, (user.streak || 0) + 1);
          } else {
            // Not active yesterday, reset streak
            await storage.updateUserStreak(userId, 1);
          }
        }
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const { category } = req.query;
      const courses = await storage.getCourses(category as string);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can create courses" });
      }

      const courseData = insertCourseSchema.parse({
        ...req.body,
        educatorId: userId
      });
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.post('/api/courses/:id/enroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: courseId } = req.params;
      
      const enrollment = await storage.enrollUser(userId, courseId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  // User enrollment routes
  app.get('/api/user/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.put('/api/user/enrollments/:courseId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.params;
      const { progress, completedModules } = updateEnrollmentProgressSchema.parse(req.body);
      
      await storage.updateEnrollmentProgress(userId, courseId, progress, completedModules);
      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Quiz routes
  app.get('/api/courses/:courseId/quizzes', async (req, res) => {
    try {
      const { courseId } = req.params;
      const quizzes = await storage.getQuizzesByCourse(courseId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/courses/:courseId/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { courseId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can create quizzes" });
      }

      const quizData = insertQuizSchema.parse({
        ...req.body,
        courseId
      });
      
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.post('/api/quizzes/:quizId/attempt', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId } = req.params;
      const { answers, score, timeSpent, difficulty } = req.body;
      
      const attemptData = insertQuizAttemptSchema.parse({
        userId,
        quizId,
        answers,
        score,
        timeSpent,
        difficulty,
        isPassed: score >= 70
      });
      
      const attempt = await storage.submitQuizAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get('/api/user/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attempts = await storage.getUserQuizAttempts(userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // AI-powered quiz generation
  app.post('/api/ai/generate-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const { topic, difficulty, count } = generateQuizQuestionsSchema.parse(req.body);
      const questions = await generateQuizQuestions(topic, difficulty, count);
      res.json({ questions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

    // Adaptive Quiz Routes
  app.post('/api/quizzes/:quizId/start', isAuthenticated, async (req: any, res) => {
    const { quizId } = req.params;
    const userId = req.user.claims.sub;

    try {
      const data = await startQuiz(quizId, userId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/quizzes/sessions/:sessionId/submit', isAuthenticated, async (req: any, res) => {
    const { sessionId } = req.params;
    try {
      const { questionId, selectedOption } = submitAnswerSchema.parse(req.body);

      const data = await submitAnswer(sessionId, questionId, selectedOption);
      res.json(data);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/quizzes/sessions/:sessionId/next', isAuthenticated, async (req: any, res) => {
    const { sessionId } = req.params;

    try {
      const data = await getNextQuestion(sessionId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Badge routes
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/user/badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const { timeFrame = 'weekly', limit = 100 } = req.query;
      const leaderboard = await storage.getLeaderboard(
        timeFrame as 'weekly' | 'monthly' | 'alltime',
        parseInt(limit as string)
      );
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Community routes
  app.get('/api/community/posts', async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const posts = await storage.getPosts(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/community/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Moderate content before posting
      const moderation = await moderateContent(req.body.content);
      if (!moderation.isAppropriate) {
        return res.status(400).json({ 
          message: "Content not appropriate", 
          reason: moderation.reason 
        });
      }

      const postData = insertPostSchema.parse({
        ...req.body,
        userId
      });
      
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/community/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.likePost(userId, postId);
      res.json({ message: "Post liked successfully" });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // AI Tutor routes
  app.post('/api/ai/tutor', isAuthenticated, async (req: any, res) => {
    try {
      const { question, context } = aiTutorRequestSchema.parse(req.body);
      const response = await generateTutorResponse(question, context);
      res.json({ response });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error getting tutor response:", error);
      res.status(500).json({ message: "Failed to get tutor response" });
    }
  });

  app.post('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationData = insertAiConversationSchema.parse({
        ...req.body,
        userId
      });
      
      const conversation = await storage.saveConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving conversation:", error);
      res.status(500).json({ message: "Failed to save conversation" });
    }
  });

  app.get('/api/user/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Analytics routes
  app.get('/api/user/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = 30 } = req.query;
      const analytics = await storage.getUserAnalytics(userId, parseInt(days as string));
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/user/recent-activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getRecentActivity(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get('/api/user/analytics/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { days = 30 } = req.query; // Default to 30 days
      const summary = await storage.getAnalyticsSummary(userId, parseInt(days as string));
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/user/analytics/accuracy-by-topic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accuracyByTopic = await storage.getAccuracyRatePerTopic(userId);
      res.json(accuracyByTopic);
    } catch (error) {
      console.error("Error fetching accuracy by topic:", error);
      res.status(500).json({ message: "Failed to fetch accuracy by topic" });
    }
  });

  app.get('/api/educator/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can access this resource" });
      }

      const courses = await storage.getEducatorCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching educator courses:", error);
      res.status(500).json({ message: "Failed to fetch educator courses" });
    }
  });

  app.get('/api/educator/quizzes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can access this resource" });
      }

      const quizzes = await storage.getEducatorQuizzes(userId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching educator quizzes:", error);
      res.status(500).json({ message: "Failed to fetch educator quizzes" });
    }
  });

  app.get('/api/quizzes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can access this resource" });
      }

      const { id } = req.params;
      const quiz = await storage.getQuiz(id);

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Ensure the educator owns the quiz
      if (quiz.educatorId !== userId) {
        return res.status(403).json({ message: "You do not own this quiz" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.put('/api/quizzes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.isEducator) {
        return res.status(403).json({ message: "Only educators can access this resource" });
      }

      const { id } = req.params;
      const quizData = insertQuizSchema.parse(req.body); // Validate incoming data

      const existingQuiz = await storage.getQuiz(id);
      if (!existingQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Ensure the educator owns the quiz
      if (existingQuiz.educatorId !== userId) {
        return res.status(403).json({ message: "You do not own this quiz" });
      }

      const updatedQuiz = await storage.updateQuiz(id, quizData);
      res.json(updatedQuiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  // AI-powered recommendations
  app.get('/api/ai/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attempts = await storage.getUserQuizAttempts(userId);
      
      const analysis = await analyzeQuizPerformance(attempts);
      const recommendations = await provideLearningRecommendations(
        { userId, level: 12 }, // This should come from user data
        analysis.weakAreas
      );
      
      res.json({ 
        analysis,
        recommendations 
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.json({ message: "Failed to get recommendations" });
    }
  });

  // Update user XP and streaks
  app.post('/api/user/xp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { xp } = updateXPSchema.parse(req.body);
      
      await storage.updateUserXP(userId, xp);
      res.json({ message: "XP updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating XP:", error);
      res.status(500).json({ message: "Failed to update XP" });
    }
  });

  app.post('/api/user/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streak } = updateStreakSchema.parse(req.body);
      
      await storage.updateUserStreak(userId, streak);
      res.json({ message: "Streak updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}