import {
  users,
  courses,
  enrollments,
  quizzes,
  quizAttempts,
  questions,
  badges,
  userBadges,
  posts,
  postInteractions,
  aiConversations,
  userAnalytics,
  userQuizSessions,
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
  type Question,
  type UserQuizSession,
  type InsertUserQuizSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, inArray, like } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserOnboarding(userId: string, data: { educationLevel: string; isOnboarded: boolean }): Promise<void>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // Course operations
  getCourses(category?: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
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

  // Question operations
  getQuestionsByQuiz(quizId: string): Promise<Question[]>;
  getQuestionsByDifficulty(quizId: string, difficulty: string): Promise<Question[]>;

  // Quiz session operations
  createQuizSession(session: InsertUserQuizSession): Promise<UserQuizSession>;
  getQuizSession(sessionId: string): Promise<UserQuizSession | undefined>;
  updateQuizSession(sessionId: string, updates: Partial<UserQuizSession>): Promise<UserQuizSession>;

  // Badge operations
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<Badge[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;

  // Leaderboard operations
  getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'alltime', limit?: number): Promise<User[]>;

  // Community operations
  getPosts(limit?: number, offset?: number): Promise<(Post & { author?: { firstName: string | null; lastName: string | null; username: string | null; profileImageUrl: string | null } })[]>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = userData.id ? await this.getUser(userData.id) : undefined;
    if (existing) {
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    }
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserOnboarding(userId: string, data: { educationLevel: string; isOnboarded: boolean }): Promise<void> {
    await db
      .update(users)
      .set({
        educationLevel: data.educationLevel,
        isOnboarded: data.isOnboarded,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
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
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getEducatorCourses(educatorId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.educatorId, educatorId)).orderBy(desc(courses.createdAt));
  }

  // Enrollment operations
  async enrollUser(userId: string, courseId: string): Promise<Enrollment> {
    // Check if already enrolled
    const [existing] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

    if (existing) {
      return existing;
    }

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
        completedAt: progress >= 100 ? new Date().toISOString() : null
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
    const xpEarned = Math.floor(attempt.score * 10);
    await this.updateUserXP(attempt.userId, xpEarned);

    return quizAttempt;
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  }

  async getEducatorQuizzes(educatorId: string): Promise<Quiz[]> {
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

  // Question operations
  async getQuestionsByQuiz(quizId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async getQuestionsByDifficulty(quizId: string, difficulty: string): Promise<Question[]> {
    return await db.select().from(questions)
      .where(and(eq(questions.quizId, quizId), eq(questions.difficulty, difficulty)));
  }

  // Quiz session operations
  async createQuizSession(session: InsertUserQuizSession): Promise<UserQuizSession> {
    const [newSession] = await db.insert(userQuizSessions).values(session).returning();
    return newSession;
  }

  async getQuizSession(sessionId: string): Promise<UserQuizSession | undefined> {
    const [session] = await db.select().from(userQuizSessions).where(eq(userQuizSessions.id, sessionId));
    return session;
  }

  async updateQuizSession(sessionId: string, updates: Partial<UserQuizSession>): Promise<UserQuizSession> {
    const [updated] = await db.update(userQuizSessions)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(userQuizSessions.id, sessionId))
      .returning();
    return updated;
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
    // Check if already awarded
    const [existing] = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    if (!existing) {
      await db.insert(userBadges).values({ userId, badgeId });
    }
  }

  // Leaderboard operations
  async getLeaderboard(timeFrame: 'weekly' | 'monthly' | 'alltime', limit: number = 100): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isOnboarded, true))
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  // Community operations
  async getPosts(limit: number = 20, offset: number = 0): Promise<(Post & { author?: { firstName: string | null; lastName: string | null; username: string | null; profileImageUrl: string | null } })[]> {
    const result = await db
      .select({
        post: posts,
        author: {
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(r => ({
      ...r.post,
      author: r.author ?? undefined,
    }));
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
    await db
      .update(users)
      .set({
        xp: sql`${users.xp} + ${xpToAdd}`,
        level: sql`(${users.xp} + ${xpToAdd}) / 1000 + 1`,
        lastActiveDate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(users)
      .set({ streak, lastActiveDate: new Date().toISOString() })
      .where(eq(users.id, userId));
  }

  async getUserAnalytics(userId: string, days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    return await db
      .select()
      .from(userAnalytics)
      .where(and(
        eq(userAnalytics.userId, userId),
        gte(userAnalytics.date, dateStr)
      ))
      .orderBy(desc(userAnalytics.date));
  }

  async getRecentActivity(userId: string): Promise<any[]> {
    const enrollmentActivity = await db
      .select({
        type: sql<string>`'course_enrollment'`,
        title: courses.title,
        date: enrollments.enrolledAt,
        id: enrollments.id,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(5);

    const quizActivity = await db
      .select({
        type: sql<string>`'quiz_completed'`,
        title: quizzes.title,
        date: quizAttempts.completedAt,
        id: quizAttempts.id,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(5);

    const badgeActivity = await db
      .select({
        type: sql<string>`'badge_earned'`,
        title: badges.name,
        date: userBadges.earnedAt,
        id: userBadges.id,
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

    return allActivities.slice(0, 10);
  }

  async getAnalyticsSummary(userId: string, days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const dateStr = dateFrom.toISOString().split('T')[0];

    const analyticsData = await db
      .select()
      .from(userAnalytics)
      .where(and(
        eq(userAnalytics.userId, userId),
        gte(userAnalytics.date, dateStr)
      ))
      .orderBy(userAnalytics.date);

    let accumulatedXp = 0;
    return analyticsData.map(data => {
      accumulatedXp += data.xpEarned || 0;
      return {
        date: data.date || '',
        xpEarned: data.xpEarned || 0,
        accumulatedXp,
        quizzesCompleted: data.quizzesCompleted || 0,
        accuracyRate: data.accuracyRate || 0,
      };
    });
  }

  async getAccuracyRatePerTopic(userId: string): Promise<any[]> {
    const result = await db
      .select({
        topic: courses.category,
        averageScore: sql<number>`AVG(${quizAttempts.score})`,
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
