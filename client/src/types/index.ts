export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: Date;
  isEducator: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  educatorId?: string;
  modules: number;
  estimatedHours: number;
  rating: number;
  enrollmentCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore: number;
  isAdaptive: boolean;
  createdAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: any;
  score: number;
  timeSpent?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isPassed: boolean;
  completedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  iconClass: string;
  type: 'achievement' | 'milestone' | 'streak' | 'skill';
  criteria: any;
  xpReward: number;
  rarity: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  isAchievement: boolean;
  createdAt: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AiConversation {
  id: string;
  userId: string;
  messages: Message[];
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedModules: number;
  timeSpent: number;
  isCompleted: boolean;
  enrolledAt: Date;
  completedAt?: Date;
}
