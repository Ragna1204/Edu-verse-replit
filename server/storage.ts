import {
  users,
  courses,
  enrollments,
  quizzes,
  quizAttempts,
  badges,
  userBadges,
  posts,
  postInteractions,
  aiConversations,
  userAnalytics,
  studyGroups,
  studyGroupMembers,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Badge,
  type Post,
  type InsertPost,
  type AiConversation,
  type InsertAiConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(category?: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course>;
  getEducatorCourses(educatorId: string): Promise<Course[]>;
  
  // Enrollment operations
  enrollUser(userId: string, courseId: string): Promise<Enrollment>;
  getUserEnrollments(userId: string): Promise<Enrollment[]>;
  updateEnrollmentProgress(userId: string, courseId: string, progress: number, completedModules: number): Promise<void>;
  
  // Quiz operations
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz>;
  submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  getEducatorQuizzes(educatorId: string): Promise<Quiz[]>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<Badge[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;
  
  // Leaderboard operations
  getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'alltime', limit?: number): Promise<User[]>;
  
  // Community operations
  getPosts(limit?: number, offset?: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(userId: string, postId: string): Promise<void>;
  
  // AI operations
  saveConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getUserConversations(userId: string): Promise<AiConversation[]>;
  
  // Analytics operations
  updateUserXP(userId: string, xp: number): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  getUserAnalytics(userId: string, days: number): Promise<any[]>;
  getRecentActivity(userId: string): Promise<any[]>;
  getAnalyticsSummary(userId: string, days: number): Promise<any[]>;
  getAccuracyRatePerTopic(userId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(category?: string): Promise<Course[]> {
    if (category && category !== 'all') {
      return await db
        .select()
        .from(courses)
        .where(and(
          eq(courses.isPublished, true),
          eq(courses.category, category)
        ))
        .orderBy(desc(courses.createdAt));
    }
    
    return await db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async getEducatorCourses(educatorId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.educatorId, educatorId)).orderBy(desc(courses.createdAt));
  }

  // Enrollment operations
  async enrollUser(userId: string, courseId: string): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values({ userId, courseId })
      .returning();
    
    // Update course enrollment count
    await db
      .update(courses)
      .set({ enrollmentCount: sql`${courses.enrollmentCount} + 1` })
      .where(eq(courses.id, courseId));
    
    return enrollment;
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async updateEnrollmentProgress(userId: string, courseId: string, progress: number, completedModules: number): Promise<void> {
    await db
      .update(enrollments)
      .set({ 
        progress, 
        completedModules,
        isCompleted: progress >= 100,
        completedAt: progress >= 100 ? new Date() : null
      })
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ));
  }

  // Quiz operations
  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [quizAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    
    // Award XP based on score
    const xpEarned = Math.floor(attempt.score * 10); // 10 XP per percentage point
    await this.updateUserXP(attempt.userId, xpEarned);

    // Update user analytics
    await this.updateUserAnalytics(attempt.userId);
    
    return quizAttempt;
  }

  async updateUserAnalytics(userId: string): Promise<void> {
    const userQuizAttempts = await this.getUserQuizAttempts(userId);
    const userEnrollments = await this.getUserEnrollments(userId);

    const quizzesCompleted = new Set(userQuizAttempts.map(a => a.quizId)).size;
    const totalScore = userQuizAttempts.reduce((sum, a) => sum + a.score, 0);
    const accuracyRate = userQuizAttempts.length > 0 ? totalScore / userQuizAttempts.length : 0;
    const timeSpent = userQuizAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

    const today = new Date().toISOString().split('T')[0];

    await db.insert(userAnalytics)
      .values({
        userId,
        date: new Date(today),
        quizzesCompleted,
        accuracyRate,
        timeSpent: Math.floor(timeSpent / 60),
      })
      .onConflictDoUpdate({
        target: [userAnalytics.userId, userAnalytics.date],
        set: {
          quizzesCompleted,
          accuracyRate,
          timeSpent: Math.floor(timeSpent / 60),
        }
      });
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  async getEducatorQuizzes(educatorId: string): Promise<Quiz[]> {
    // Get quizzes through courses owned by the educator
    const educatorCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.educatorId, educatorId));
    
    const courseIds = educatorCourses.map(c => c.id);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    return await db
      .select()
      .from(quizzes)
      .where(inArray(quizzes.courseId, courseIds))
      .orderBy(desc(quizzes.createdAt));
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    const userBadgeData = await db
      .select({ badge: badges })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return userBadgeData.map(row => row.badge);
  }

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    await db.insert(userBadges).values({ userId, badgeId });
  }

  // Leaderboard operations
  async getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'alltime', limit: number = 100): Promise<User[]> {
    let dateFilter;
    const now = new Date();
    
    switch (timeFrame) {
      case 'weekly':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = null;
    }

    if (dateFilter) {
      return await db
        .select()
        .from(users)
        .where(gte(users.lastActiveDate, dateFilter))
        .orderBy(desc(users.xp))
        .limit(limit);
    }

    return await db
      .select()
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  // Community operations
  async getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    // Check if already liked
    const existing = await db
      .select()
      .from(postInteractions)
      .where(and(
        eq(postInteractions.userId, userId),
        eq(postInteractions.postId, postId),
        eq(postInteractions.type, 'like')
      ));

    if (existing.length === 0) {
      await db.insert(postInteractions).values({
        userId,
        postId,
        type: 'like'
      });
      
      // Update post likes count
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));
    }
  }

  // AI operations
  async saveConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [saved] = await db.insert(aiConversations).values(conversation).returning();
    return saved;
  }

  async getUserConversations(userId: string): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  // Analytics operations
  async updateUserXP(userId: string, xpToAdd: number): Promise<void> {
    const [user] = await db
      .update(users)
      .set({ 
        xp: sql`${users.xp} + ${xpToAdd}`,
        level: sql`FLOOR((${users.xp} + ${xpToAdd}) / 1000) + 1`
      })
      .where(eq(users.id, userId))
      .returning();
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(users)
      .set({ streak, lastActiveDate: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserAnalytics(userId: string, days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await db
      .select()
      .from(userAnalytics)
      .where(and(
        eq(userAnalytics.userId, userId),
        gte(userAnalytics.date, dateFrom)
      ))
      .orderBy(desc(userAnalytics.date));
  }

  async getRecentActivity(userId: string): Promise<any[]> {
    const enrollmentActivity = await db
      .select({
        type: sql`'course_enrollment' as type`,
        title: courses.title,
        date: enrollments.enrolledAt,
        id: enrollments.id
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(5);

    const quizActivity = await db
      .select({
        type: sql`'quiz_completed' as type`,
        title: quizzes.title,
        date: quizAttempts.completedAt,
        id: quizAttempts.id
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(5);

    const badgeActivity = await db
      .select({
        type: sql`'badge_earned' as type`,
        title: badges.name,
        date: userBadges.earnedAt,
        id: userBadges.id
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt))
      .limit(5);

    const allActivities = [
      ...enrollmentActivity,
      ...quizActivity,
      ...badgeActivity,
    ];

    allActivities.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return allActivities.slice(0, 5);
  }

  async getAnalyticsSummary(userId: string, days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const analyticsData = await db
      .select()
      .from(userAnalytics)
      .where(and(
        eq(userAnalytics.userId, userId),
        gte(userAnalytics.date, dateFrom)
      ))
      .orderBy(userAnalytics.date);

    let accumulatedXp = 0;
    const summary = analyticsData.map(data => {
      accumulatedXp += data.xpEarned || 0;
      return {
        date: data.date ? data.date.toISOString().split('T')[0] : '',
        xpEarned: data.xpEarned || 0,
        accumulatedXp: accumulatedXp,
        quizzesCompleted: data.quizzesCompleted || 0,
        accuracyRate: data.accuracyRate || 0,
      };
    });

    return summary;
  }

  async getAccuracyRatePerTopic(userId: string): Promise<any[]> {
    const result = await db
      .select({
        topic: courses.category,
        averageScore: sql<number>`AVG(${quizAttempts.score})`.mapWith(Number),
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(eq(quizAttempts.userId, userId))
      .groupBy(courses.category);

    return result;
  }
}

export const storage = new DatabaseStorage();
