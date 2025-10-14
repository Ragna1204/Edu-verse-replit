import type { Express } from "express";
import { createServer, type Server } from "http";

// TEMPORARY: In-memory user store for testing authentication
interface InMemoryUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnboarded: boolean;
  grade?: number;
  board?: string;
  subjects?: string[];
  createdAt: string;
}

const inMemoryUsers: Map<string, InMemoryUser> = new Map();
const nextUserId = { current: 1 };

// TEMPORARY: Simple password storage (NEVER do this in production!)
const userPasswords: Map<string, string> = new Map();

// Helper functions
const getNextId = () => `user-${nextUserId.current++}`;

const createInMemoryUser = (userData: { username: string; firstName: string; lastName: string }) => {
  const user: InMemoryUser = {
    id: getNextId(),
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: `${userData.username}@eduverse.local`,
    isOnboarded: false,
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.set(user.id, user);
  return user;
};

const getUserByUsername = (username: string) => {
  return Array.from(inMemoryUsers.values()).find(u => u.username === username);
};

const getUserById = (id: string) => {
  return inMemoryUsers.get(id);
};

const updateUserOnboarding = (userId: string, onboardingData: any) => {
  const user = inMemoryUsers.get(userId);
  if (user) {
    Object.assign(user, {
      ...onboardingData,
      isOnboarded: true
    });
  }
  return user;
};

const storage = {
  upsertUser: createInMemoryUser,
  updateUserOnboarding,
  getUser: getUserById,
  getUserByUsername
};

export async function registerRoutes(app: Express): Promise<Server> {


  // Firebase auth routes
  app.post('/api/auth/firebase-user', async (req, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;

      if (!uid || !email) {
        return res.status(400).json({ message: 'Firebase UID and email are required' });
      }

      // Split displayName if it exists
      const firstName = displayName ? displayName.split(' ')[0] : null;
      const lastName = displayName && displayName.split(' ').length > 1 ? displayName.split(' ').slice(1).join(' ') : null;

      const user = await storage.upsertUser({
        id: uid,
        email,
        firstName,
        lastName,
        profileImageUrl: photoURL,
      });

      res.json(user);
    } catch (error) {
      console.error('Error creating/updating Firebase user:', error);
      res.status(500).json({ message: 'Failed to create/update user' });
    }
  });

  // Update user onboarding data
  app.put('/api/auth/onboard/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, grade, board, subjects, isOnboarded } = req.body;

      await storage.updateUserOnboarding(userId, {
        username,
        grade,
        board,
        subjects,
        isOnboarded,
      });

      res.json({ message: 'User onboarding completed successfully' });
    } catch (error) {
      console.error('Error updating user onboarding:', error);
      res.status(500).json({ message: 'Failed to update user onboarding' });
    }
  });

  // Get Firebase user data
  app.get('/api/auth/firebase-user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching Firebase user:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });

  // Custom username/password authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { username, password, firstName, lastName } = req.body;

      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Validate username format
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

      // Check if username already exists (using in-memory store)
      const existingUser = storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
      }

      // Hash password (simple example - in production use proper hashing like bcrypt)
      const hashedPassword = password; // TODO: Implement proper password hashing

      // Create user
      const user = await storage.upsertUser({
        email: `${username}@eduverse.local`, // Temporary email for username-based auth
        firstName,
        lastName,
        username,
        // Additional fields will be set during onboarding
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find user by username (using in-memory store)
      const user = storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // TEMPORARY: Disable password verification for development testing
      // TODO: Implement proper password verification with hashing for production
      // For now, any non-empty password passes validation

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
        }
      });
    } catch (error) {
      console.error('Error signing in:', error);
      res.status(500).json({ message: 'Failed to sign in' });
    }
  });

  // Auth routes (TEMPORARLY DISABLED AUTH MIDDLEWARE FOR TESTING)
  app.get('/api/auth/user', async (req: any, res) => {
    console.log("Executing /api/auth/user route handler");
    // Return null for testing since we have no user session management yet
    res.json(null);
  });

  // Course routes (TEMPORARILY DISABLED FOR TESTING - return empty arrays)
  app.get('/api/courses', async (req, res) => {
    try {
      // Return empty array during auth testing
      res.json([]);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      // Return not found during auth testing
      res.status(404).json({ message: "Course not found" });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(201).json({ message: "Course created successfully" });
  });

  app.put('/api/courses/:id', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(200).json({ message: "Course updated successfully" });
  });

  app.delete('/api/courses/:id', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(204).send();
  });

  app.post('/api/courses/:id/enroll', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(201).json({ message: "Enrolled successfully" });
  });

  // User enrollment routes
  app.get('/api/user/enrollments', async (req: any, res) => {
    // Temporarily return empty array for testing
    res.json([]);
  });

  app.put('/api/user/enrollments/:courseId/progress', async (req: any, res) => {
    // Temporarily return success for testing
    res.json({ message: "Progress updated successfully" });
  });

  // Quiz routes
  app.get('/api/courses/:courseId/quizzes', async (req, res) => {
    // Temporarily return empty array for testing
    res.json([]);
  });

  app.post('/api/courses/:courseId/quizzes', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(201).json({ message: "Quiz created successfully" });
  });

  app.post('/api/quizzes/:quizId/attempt', async (req: any, res) => {
    // Temporarily return success for testing
    res.status(201).json({ message: "Quiz attempt submitted successfully" });
  });

  app.get('/api/user/quiz-attempts', async (req: any, res) => {
    // Temporarily return empty array for testing
    res.json([]);
  });

  // AI-powered quiz generation
  app.post('/api/ai/generate-quiz', async (req: any, res) => {
    // Temporarily return success for testing
    res.json({ questions: [], message: "Quiz generation disabled for auth testing" });
  });

    // Adaptive Quiz Routes
  app.post('/api/quizzes/:quizId/start', async (req: any, res) => {
    // Temporarily return success for testing
    res.json({ message: "Quiz started successfully" });
  });

  app.post('/api/quizzes/sessions/:sessionId/submit', async (req: any, res) => {
    // Temporarily return success for testing
    res.json({ message: "Answer submitted successfully" });
  });

  app.get('/api/quizzes/sessions/:sessionId/next', async (req: any, res) => {
    // Temporarily return null for testing
    res.json(null);
  });


  // Temporarily disable remaining routes for auth testing
  app.get('/api/badges', async (req, res) => {
    res.json([]);
  });

  app.get('/api/user/badges', async (req, res) => {
    res.json([]);
  });

  app.get('/api/leaderboard', async (req, res) => {
    res.json([]);
  });

  app.get('/api/community/posts', async (req, res) => {
    res.json([]);
  });

  app.post('/api/community/posts', async (req: any, res) => {
    res.status(201).json({ message: "Post created successfully" });
  });

  app.post('/api/community/posts/:postId/like', async (req: any, res) => {
    res.json({ message: "Post liked successfully" });
  });

  app.post('/api/ai/tutor', async (req: any, res) => {
    res.json({ response: "AI tutor response disabled for testing" });
  });

  app.post('/api/ai/conversations', async (req: any, res) => {
    res.status(201).json({ message: "Conversation saved successfully" });
  });

  app.get('/api/user/conversations', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/user/analytics', async (req: any, res) => {
    res.json({});
  });

  app.get('/api/user/recent-activity', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/user/analytics/summary', async (req: any, res) => {
    res.json({});
  });

  app.get('/api/user/analytics/accuracy-by-topic', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/educator/courses', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/educator/quizzes', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/quizzes/:id', async (req: any, res) => {
    res.status(404).json({ message: "Quiz not found" });
  });

  app.put('/api/quizzes/:id', async (req: any, res) => {
    res.json({ message: "Quiz updated successfully" });
  });

  app.get('/api/ai/recommendations', async (req: any, res) => {
    res.json({ analysis: {}, recommendations: [] });
  });

  app.post('/api/user/xp', async (req: any, res) => {
    res.json({ message: "XP updated successfully" });
  });

  app.post('/api/user/streak', async (req: any, res) => {
    res.json({ message: "Streak updated successfully" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
