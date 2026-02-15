import { sql } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text in SQLite
    expire: text("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  grade: integer("grade"), // 1-12 for students
  board: text("board"), // CBSE, ICSE, State, etc.
  subjects: text("subjects", { mode: "json" }).$type<string[]>(), // array of subjects
  isOnboarded: integer("is_onboarded", { mode: "boolean" }).default(false),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("student"), // student, educator, admin
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActiveDate: text("last_active_date"),
  isEducator: integer("is_educator", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Badges table
export const badges = sqliteTable("badges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  iconClass: text("icon_class").notNull(), // FontAwesome class
  type: text("type").notNull(), // achievement, milestone, streak, skill
  criteria: text("criteria", { mode: "json" }).$type<Record<string, any>>().notNull(), // Requirements to earn badge
  xpReward: integer("xp_reward").default(0),
  rarity: text("rarity").default("common"), // common, rare, epic, legendary
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// User badges (earned badges)
export const userBadges = sqliteTable("user_badges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  badgeId: text("badge_id").references(() => badges.id).notNull(),
  earnedAt: text("earned_at").$defaultFn(() => new Date().toISOString()),
});

// Courses table
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  imageUrl: text("image_url"),
  educatorId: text("educator_id").references(() => users.id),
  modules: integer("modules").default(0),
  estimatedHours: integer("estimated_hours").default(0),
  rating: real("rating").default(0),
  enrollmentCount: integer("enrollment_count").default(0),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Course enrollments
export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0), // percentage 0-100
  completedModules: integer("completed_modules").default(0),
  timeSpent: integer("time_spent").default(0), // minutes
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  enrolledAt: text("enrolled_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
});

// Quizzes table
export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  timeLimit: integer("time_limit"), // minutes
  passingScore: integer("passing_score").default(70), // percentage
  isAdaptive: integer("is_adaptive", { mode: "boolean" }).default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id").references(() => courses.id).notNull(),
  quizId: text("quiz_id").references(() => quizzes.id),
  content: text("content").notNull(),
  options: text("options", { mode: "json" }).$type<Array<{ text: string; isCorrect: boolean }>>().notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  explanation: text("explanation"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// User quiz sessions table
export const userQuizSessions = sqliteTable("user_quiz_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  quizId: text("quiz_id").references(() => quizzes.id).notNull(),
  currentQuestionIndex: integer("current_question_index").default(0),
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").default(0),
  correctAnswers: integer("correct_answers").default(0),
  currentDifficulty: text("current_difficulty").default("easy"),
  performanceHistory: text("performance_history", { mode: "json" }).$type<Array<{ questionId: string; isCorrect: boolean }>>().default([]),
  isComplete: integer("is_complete", { mode: "boolean" }).default(false),
  startedAt: text("started_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// Quiz attempts
export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  quizId: text("quiz_id").references(() => quizzes.id).notNull(),
  answers: text("answers", { mode: "json" }).$type<any>().notNull(), // User's answers
  score: integer("score").notNull(), // percentage
  timeSpent: integer("time_spent"), // seconds
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  isPassed: integer("is_passed", { mode: "boolean" }).notNull(),
  completedAt: text("completed_at").$defaultFn(() => new Date().toISOString()),
});

// Community posts
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>(), // Array of tag strings
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  isAchievement: integer("is_achievement", { mode: "boolean" }).default(false),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Post interactions
export const postInteractions = sqliteTable("post_interactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  postId: text("post_id").references(() => posts.id).notNull(),
  type: text("type").notNull(), // like, comment, share
  content: text("content"), // for comments
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// AI tutor conversations
export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  messages: text("messages", { mode: "json" }).$type<Array<{ role: string; content: string }>>().notNull(),
  context: text("context"), // course, quiz, general
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// User progress analytics
export const userAnalytics = sqliteTable("user_analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id).notNull(),
  date: text("date").$defaultFn(() => new Date().toISOString().split('T')[0]),
  sessionsCount: integer("sessions_count").default(0),
  timeSpent: integer("time_spent").default(0), // minutes
  xpEarned: integer("xp_earned").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  accuracyRate: real("accuracy_rate").default(0),
});

// Study groups
export const studyGroups = sqliteTable("study_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  courseId: text("course_id").references(() => courses.id),
  creatorId: text("creator_id").references(() => users.id).notNull(),
  memberCount: integer("member_count").default(1),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Study group memberships
export const studyGroupMembers = sqliteTable("study_group_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text("group_id").references(() => studyGroups.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // member, admin
  joinedAt: text("joined_at").$defaultFn(() => new Date().toISOString()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  quizAttempts: many(quizAttempts),
  userBadges: many(userBadges),
  posts: many(posts),
  createdCourses: many(courses),
  aiConversations: many(aiConversations),
  analytics: many(userAnalytics),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  educator: one(users, {
    fields: [courses.educatorId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  quizzes: many(quizzes),
  questions: many(questions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  attempts: many(quizAttempts),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  course: one(courses, {
    fields: [questions.courseId],
    references: [courses.id],
  }),
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const userQuizSessionsRelations = relations(userQuizSessions, ({ one }) => ({
  user: one(users, {
    fields: [userQuizSessions.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [userQuizSessions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertQuiz = typeof quizzes.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuestion = typeof questions.$inferInsert;
export type Question = typeof questions.$inferSelect;

export type InsertUserQuizSession = typeof userQuizSessions.$inferInsert;
export type UserQuizSession = typeof userQuizSessions.$inferSelect;

export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

export type InsertBadge = typeof badges.$inferInsert;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = typeof userBadges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertPostInteraction = typeof postInteractions.$inferInsert;
export type PostInteraction = typeof postInteractions.$inferSelect;

export type InsertAiConversation = typeof aiConversations.$inferInsert;
export type AiConversation = typeof aiConversations.$inferSelect;

export type InsertUserAnalytics = typeof userAnalytics.$inferInsert;
export type UserAnalytics = typeof userAnalytics.$inferSelect;

// Insert schemas for validation
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertUserQuizSessionSchema = createInsertSchema(userQuizSessions).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likes: true,
  comments: true,
  shares: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEnrollmentProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  completedModules: z.number().min(0),
});

export const generateQuizQuestionsSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.number().min(0),
});

export const aiTutorRequestSchema = z.object({
  question: z.string().min(1),
  context: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
});

export const updateXPSchema = z.object({
  xp: z.number().min(0),
});

export const updateStreakSchema = z.object({
  streak: z.number().min(0),
});
