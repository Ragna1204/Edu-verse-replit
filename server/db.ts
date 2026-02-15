import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join } from 'path';
import { mkdirSync } from 'fs';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Extract database path from DATABASE_URL
let dbPath: string;
if (process.env.DATABASE_URL.startsWith('file:')) {
  dbPath = process.env.DATABASE_URL.replace('file:', '');
} else {
  dbPath = process.env.DATABASE_URL;
}

// Create the directory if it doesn't exist
const dir = join(process.cwd());
mkdirSync(dir, { recursive: true });

const sqlite = new Database(join(dir, dbPath));

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Auto-create all tables if they don't exist
function createTablesIfNotExist() {
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master WHERE type='table';
  `).all() as { name: string }[];

  const existingTables = new Set(tables.map(t => t.name));

  if (!existingTables.has('sessions')) {
    sqlite.exec(`
      CREATE TABLE sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    console.log('Created sessions table');
  }

  if (!existingTables.has('users')) {
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        username TEXT UNIQUE,
        password_hash TEXT,
        education_level TEXT,
        is_onboarded INTEGER DEFAULT 0,
        profile_image_url TEXT,
        role TEXT DEFAULT 'student',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        last_active_date TEXT,
        is_educator INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    console.log('Created users table');
  }

  if (!existingTables.has('badges')) {
    sqlite.exec(`
      CREATE TABLE badges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL,
        type TEXT NOT NULL,
        criteria TEXT NOT NULL,
        xp_reward INTEGER DEFAULT 0,
        color TEXT DEFAULT '#4CAF50',
        created_at TEXT
      );
    `);
    console.log('Created badges table');
  }

  if (!existingTables.has('user_badges')) {
    sqlite.exec(`
      CREATE TABLE user_badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        badge_id TEXT NOT NULL REFERENCES badges(id),
        earned_at TEXT
      );
    `);
    console.log('Created user_badges table');
  }

  if (!existingTables.has('courses')) {
    sqlite.exec(`
      CREATE TABLE courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        image_url TEXT,
        educator_id TEXT REFERENCES users(id),
        modules INTEGER DEFAULT 0,
        estimated_hours INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        enrollment_count INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 0,
        xp_reward INTEGER DEFAULT 100,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    console.log('Created courses table');
  }

  if (!existingTables.has('lessons')) {
    sqlite.exec(`
      CREATE TABLE lessons (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id),
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        xp_reward INTEGER DEFAULT 5,
        estimated_minutes INTEGER DEFAULT 10,
        created_at TEXT
      );
    `);
    console.log('Created lessons table');
  }

  if (!existingTables.has('user_lesson_progress')) {
    sqlite.exec(`
      CREATE TABLE user_lesson_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        lesson_id TEXT NOT NULL REFERENCES lessons(id),
        course_id TEXT NOT NULL REFERENCES courses(id),
        is_completed INTEGER DEFAULT 0,
        score INTEGER,
        completed_at TEXT
      );
    `);
    console.log('Created user_lesson_progress table');
  }

  if (!existingTables.has('enrollments')) {
    sqlite.exec(`
      CREATE TABLE enrollments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        course_id TEXT NOT NULL REFERENCES courses(id),
        progress INTEGER DEFAULT 0,
        completed_modules INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        enrolled_at TEXT,
        completed_at TEXT
      );
    `);
    console.log('Created enrollments table');
  }

  if (!existingTables.has('quizzes')) {
    sqlite.exec(`
      CREATE TABLE quizzes (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id),
        title TEXT NOT NULL,
        description TEXT,
        difficulty TEXT NOT NULL,
        time_limit INTEGER,
        passing_score INTEGER DEFAULT 70,
        is_adaptive INTEGER DEFAULT 1,
        created_at TEXT
      );
    `);
    console.log('Created quizzes table');
  }

  if (!existingTables.has('questions')) {
    sqlite.exec(`
      CREATE TABLE questions (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id),
        quiz_id TEXT REFERENCES quizzes(id),
        content TEXT NOT NULL,
        options TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        explanation TEXT,
        topic TEXT,
        created_at TEXT
      );
    `);
    console.log('Created questions table');
  }

  if (!existingTables.has('user_quiz_sessions')) {
    sqlite.exec(`
      CREATE TABLE user_quiz_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        quiz_id TEXT NOT NULL REFERENCES quizzes(id),
        current_question_index INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        current_difficulty TEXT DEFAULT 'easy',
        performance_history TEXT DEFAULT '[]',
        is_complete INTEGER DEFAULT 0,
        started_at TEXT,
        updated_at TEXT
      );
    `);
    console.log('Created user_quiz_sessions table');
  }

  if (!existingTables.has('quiz_attempts')) {
    sqlite.exec(`
      CREATE TABLE quiz_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        quiz_id TEXT NOT NULL REFERENCES quizzes(id),
        answers TEXT NOT NULL,
        score INTEGER NOT NULL,
        time_spent INTEGER,
        difficulty TEXT NOT NULL,
        is_passed INTEGER NOT NULL,
        completed_at TEXT
      );
    `);
    console.log('Created quiz_attempts table');
  }

  if (!existingTables.has('practice_topics')) {
    sqlite.exec(`
      CREATE TABLE practice_topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        question_count INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);
    console.log('Created practice_topics table');
  }

  if (!existingTables.has('practice_questions')) {
    sqlite.exec(`
      CREATE TABLE practice_questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL REFERENCES practice_topics(id),
        content TEXT NOT NULL,
        options TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        explanation TEXT,
        subtopic TEXT,
        created_at TEXT
      );
    `);
    console.log('Created practice_questions table');
  }

  if (!existingTables.has('user_topic_performance')) {
    sqlite.exec(`
      CREATE TABLE user_topic_performance (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        topic_id TEXT NOT NULL REFERENCES practice_topics(id),
        subtopic TEXT,
        total_attempted INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        last_difficulty TEXT DEFAULT 'easy',
        last_attempted_at TEXT
      );
    `);
    console.log('Created user_topic_performance table');
  }

  if (!existingTables.has('practice_sessions')) {
    sqlite.exec(`
      CREATE TABLE practice_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        topic_id TEXT NOT NULL REFERENCES practice_topics(id),
        questions_answered INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        current_difficulty TEXT DEFAULT 'easy',
        answers TEXT DEFAULT '[]',
        is_complete INTEGER DEFAULT 0,
        started_at TEXT,
        completed_at TEXT
      );
    `);
    console.log('Created practice_sessions table');
  }

  if (!existingTables.has('posts')) {
    sqlite.exec(`
      CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        tags TEXT,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        is_achievement INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);
    console.log('Created posts table');
  }

  if (!existingTables.has('post_interactions')) {
    sqlite.exec(`
      CREATE TABLE post_interactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        post_id TEXT NOT NULL REFERENCES posts(id),
        type TEXT NOT NULL,
        content TEXT,
        created_at TEXT
      );
    `);
    console.log('Created post_interactions table');
  }

  if (!existingTables.has('ai_conversations')) {
    sqlite.exec(`
      CREATE TABLE ai_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        messages TEXT NOT NULL,
        context TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    console.log('Created ai_conversations table');
  }

  if (!existingTables.has('user_analytics')) {
    sqlite.exec(`
      CREATE TABLE user_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        date TEXT,
        sessions_count INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        accuracy_rate REAL DEFAULT 0
      );
    `);
    console.log('Created user_analytics table');
  }

  if (!existingTables.has('study_groups')) {
    sqlite.exec(`
      CREATE TABLE study_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        course_id TEXT REFERENCES courses(id),
        creator_id TEXT NOT NULL REFERENCES users(id),
        member_count INTEGER DEFAULT 1,
        is_public INTEGER DEFAULT 1,
        created_at TEXT
      );
    `);
    console.log('Created study_groups table');
  }

  if (!existingTables.has('study_group_members')) {
    sqlite.exec(`
      CREATE TABLE study_group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES study_groups(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT DEFAULT 'member',
        joined_at TEXT
      );
    `);
    console.log('Created study_group_members table');
  }
}

createTablesIfNotExist();
console.log('Database initialized with all tables.');

export const db = drizzle(sqlite, { schema });
