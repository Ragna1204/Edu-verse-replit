import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateTutorResponse, generateQuizQuestions, provideLearningRecommendations, adaptQuizDifficulty } from "./services/gemini";
import { analyzeQuizPerformance, generatePersonalizedContent, moderateContent } from "./services/openai";
import { insertCourseSchema, insertEnrollmentSchema, insertQuizSchema, insertQuizAttemptSchema, insertPostSchema, insertAiConversationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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
      const { progress, completedModules } = req.body;
      
      await storage.updateEnrollmentProgress(userId, courseId, progress, completedModules);
      res.json({ message: "Progress updated successfully" });
    } catch (error) {
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
      const { topic, difficulty, count } = req.body;
      const questions = await generateQuizQuestions(topic, difficulty, count);
      res.json({ questions });
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
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
      const { question, context } = req.body;
      const response = await generateTutorResponse(question, context);
      res.json({ response });
    } catch (error) {
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
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Update user XP and streaks
  app.post('/api/user/xp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { xp } = req.body;
      
      await storage.updateUserXP(userId, xp);
      res.json({ message: "XP updated successfully" });
    } catch (error) {
      console.error("Error updating XP:", error);
      res.status(500).json({ message: "Failed to update XP" });
    }
  });

  app.post('/api/user/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streak } = req.body;
      
      await storage.updateUserStreak(userId, streak);
      res.json({ message: "Streak updated successfully" });
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
