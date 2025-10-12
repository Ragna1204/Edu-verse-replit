export interface Question {
  id: string;
  content: string;
  options: any[];
  difficulty: "easy" | "medium" | "hard";
}

export interface UserQuizSession {
  id: string;
  userId: string;
  quizId: string;
  currentQuestionId: string;
  score: number;
  streak: number;
  performanceHistory: any[];
  startedAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AiConversation {
  id: string;
  userId: string;
  messages: Message[];
  context: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isAchievement: boolean;
  createdAt: Date;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
  isEducator: boolean;
  createdAt: Date;
  updatedAt: Date;
}