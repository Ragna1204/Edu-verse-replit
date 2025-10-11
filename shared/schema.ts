import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, educator, admin
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActiveDate: timestamp("last_active_date").defaultNow(),
  isEducator: boolean("is_educator").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course difficulty enum
export const courseDifficultyEnum = pgEnum('course_difficulty', ['beginner', 'intermediate', 'advanced']);

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  difficulty: courseDifficultyEnum("difficulty").notNull(),
  imageUrl: varchar("image_url"),
  educatorId: varchar("educator_id").references(() => users.id),
  modules: integer("modules").default(0),
  estimatedHours: integer("estimated_hours").default(0),
  rating: real("rating").default(0),
  enrollmentCount: integer("enrollment_count").default(0),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0), // percentage 0-100
  completedModules: integer("completed_modules").default(0),
  timeSpent: integer("time_spent").default(0), // minutes
  isCompleted: boolean("is_completed").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Quiz difficulty enum
export const quizDifficultyEnum = pgEnum('quiz_difficulty', ['easy', 'medium', 'hard']);

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  difficulty: quizDifficultyEnum("difficulty").notNull(),
  timeLimit: integer("time_limit"), // minutes
  passingScore: integer("passing_score").default(70), // percentage
  isAdaptive: boolean("is_adaptive").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  content: text("content").notNull(),
  options: jsonb("options").notNull(), // { text: string, isCorrect: boolean }[]
  difficulty: quizDifficultyEnum("difficulty").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User quiz sessions table
export const userQuizSessions = pgTable("user_quiz_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  currentQuestionId: varchar("current_question_id").references(() => questions.id),
  score: integer("score").default(0),
  streak: integer("streak").default(0),
  performanceHistory: jsonb("performance_history").default([]), // { questionId: string, isCorrect: boolean }[]
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id").references(() => quizzes.id).notNull(),
  answers: jsonb("answers").notNull(), // User's answers
  score: integer("score").notNull(), // percentage
  timeSpent: integer("time_spent"), // seconds
  difficulty: quizDifficultyEnum("difficulty").notNull(),
  isPassed: boolean("is_passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Badge types enum
export const badgeTypeEnum = pgEnum('badge_type', ['achievement', 'milestone', 'streak', 'skill']);

// Badges table
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  iconClass: varchar("icon_class").notNull(), // FontAwesome class
  type: badgeTypeEnum("type").notNull(),
  criteria: jsonb("criteria").notNull(), // Requirements to earn badge
  xpReward: integer("xp_reward").default(0),
  rarity: varchar("rarity").default("common"), // common, rare, epic, legendary
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges (earned badges)
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeId: varchar("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Community posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  tags: jsonb("tags"), // Array of tag strings
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  isAchievement: boolean("is_achievement").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post interactions
export const postInteractions = pgTable("post_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  type: varchar("type").notNull(), // like, comment, share
  createdAt: timestamp("created_at").defaultNow(),
});

// AI tutor conversations
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  messages: jsonb("messages").notNull(), // Array of message objects
  context: varchar("context"), // course, quiz, general
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress analytics
export const userAnalytics = pgTable("user_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow(),
  sessionsCount: integer("sessions_count").default(0),
  timeSpent: integer("time_spent").default(0), // minutes
  xpEarned: integer("xp_earned").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  accuracyRate: real("accuracy_rate").default(0),
});

// Study groups
export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  memberCount: integer("member_count").default(1),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study group memberships
export const studyGroupMembers = pgTable("study_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => studyGroups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member"), // member, admin
  joinedAt: timestamp("joined_at").defaultNow(),
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
  currentQuestion: one(questions, {
    fields: [userQuizSessions.currentQuestionId],
    references: [questions.id],
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
  selectedOption: z.string().min(1), // Assuming selected option is a string ID or value
});

export const aiTutorRequestSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
});

export const updateXPSchema = z.object({
  xp: z.number().min(0),
});

export const updateStreakSchema = z.object({
  streak: z.number().min(0),
});
