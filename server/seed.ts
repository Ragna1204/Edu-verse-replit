import 'dotenv/config';
import { db } from "./db";
import { badges, courses, quizzes, questions, users } from "../shared/schema";
import crypto from 'crypto';

async function seed() {
  console.log("Starting database seed...");

  // Seed badges (with colors instead of rarity)
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length > 0) {
    console.log("Badges already seeded.");
  } else {
    await db.insert(badges).values([
      {
        name: "Welcome!",
        description: "Create your EduVerse account.",
        icon: "🎉",
        type: "milestone",
        criteria: { type: "account_created" },
        xpReward: 10,
        color: "#4CAF50", // green
      },
      {
        name: "First Steps",
        description: "Complete your first lesson.",
        icon: "📖",
        type: "milestone",
        criteria: { type: "first_lesson" },
        xpReward: 10,
        color: "#2196F3", // blue
      },
      {
        name: "Quiz Whiz",
        description: "Complete your first quiz.",
        icon: "🧠",
        type: "milestone",
        criteria: { type: "first_quiz" },
        xpReward: 15,
        color: "#2196F3", // blue
      },
      {
        name: "Perfectionist",
        description: "Get a perfect score on any quiz.",
        icon: "⭐",
        type: "achievement",
        criteria: { type: "perfect_score" },
        xpReward: 25,
        color: "#FF9800", // orange
      },
      {
        name: "Course Graduate",
        description: "Complete your first course.",
        icon: "🎓",
        type: "milestone",
        criteria: { type: "first_course" },
        xpReward: 50,
        color: "#FF9800", // orange
      },
      {
        name: "Bookworm",
        description: "Complete 10 lessons.",
        icon: "📚",
        type: "milestone",
        criteria: { type: "lesson_count", count: 10 },
        xpReward: 30,
        color: "#FF9800", // orange
      },
      {
        name: "On Fire",
        description: "Maintain a 5-day streak.",
        icon: "🔥",
        type: "streak",
        criteria: { type: "streak", days: 5 },
        xpReward: 30,
        color: "#9C27B0", // purple
      },
      {
        name: "Unstoppable",
        description: "Maintain a 10-day streak.",
        icon: "⚡",
        type: "streak",
        criteria: { type: "streak", days: 10 },
        xpReward: 50,
        color: "#9C27B0", // purple
      },
      {
        name: "Scholar",
        description: "Complete 3 courses.",
        icon: "🏆",
        type: "milestone",
        criteria: { type: "course_count", count: 3 },
        xpReward: 100,
        color: "#FFD700", // gold
      },
    ]);
    console.log("Badges seeded successfully.");
  }

  // Seed users
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    console.log("Seeding default users...");
    const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');
    await db.insert(users).values([
      {
        id: "educator-1",
        email: "educator1@eduverse.local",
        firstName: "Dr. Sarah",
        lastName: "Chen",
        username: "dr_sarah",
        passwordHash,
        role: "educator",
        isEducator: true,
        isOnboarded: true,
        educationLevel: "postgraduate",
        xp: 5000,
        level: 6,
        streak: 15,
      },
      {
        id: "educator-2",
        email: "educator2@eduverse.local",
        firstName: "Prof. James",
        lastName: "Wilson",
        username: "prof_james",
        passwordHash,
        role: "educator",
        isEducator: true,
        isOnboarded: true,
        educationLevel: "postgraduate",
        xp: 3500,
        level: 4,
        streak: 8,
      },
      {
        id: "student-1",
        email: "demo@eduverse.local",
        firstName: "Demo",
        lastName: "Student",
        username: "demo_student",
        passwordHash,
        role: "student",
        isEducator: false,
        isOnboarded: true,
        educationLevel: "high_school",
        xp: 1250,
        level: 2,
        streak: 3,
      },
    ]);
    console.log("Default users seeded.");
  }

  // Seed Courses
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    console.log("Seeding courses...");

    const [course1] = await db.insert(courses).values([{
      title: "Introduction to Artificial Intelligence",
      description: "Learn the basics of Artificial Intelligence and Machine Learning. This course covers fundamental concepts including neural networks, deep learning, natural language processing, and computer vision.",
      category: "ai-ml",
      difficulty: "beginner",
      educatorId: "educator-1",
      modules: 5,
      estimatedHours: 10,
      isPublished: true,
      rating: 4.7,
      xpReward: 100,
    }]).returning();

    const [course2] = await db.insert(courses).values([{
      title: "Web Development with React",
      description: "Master modern web development using React and its ecosystem. Learn hooks, state management, routing, API integration, and best practices for building production-ready applications.",
      category: "programming",
      difficulty: "intermediate",
      educatorId: "educator-1",
      modules: 8,
      estimatedHours: 20,
      isPublished: true,
      rating: 4.8,
      xpReward: 150,
    }]).returning();

    const [course3] = await db.insert(courses).values([{
      title: "Data Science Fundamentals",
      description: "Explore the core concepts and tools of Data Science. Learn data analysis, visualization, statistical methods, and machine learning basics using Python and popular libraries.",
      category: "data-science",
      difficulty: "beginner",
      educatorId: "educator-2",
      modules: 6,
      estimatedHours: 15,
      isPublished: true,
      rating: 4.5,
      xpReward: 100,
    }]).returning();

    const [course4] = await db.insert(courses).values([{
      title: "Mathematics for Machine Learning",
      description: "Build strong mathematical foundations for ML. Covers linear algebra, calculus, probability, and statistics - the essential math you need to understand and implement machine learning algorithms.",
      category: "ai-ml",
      difficulty: "intermediate",
      educatorId: "educator-2",
      modules: 7,
      estimatedHours: 18,
      isPublished: true,
      rating: 4.6,
      xpReward: 150,
    }]).returning();

    const [course5] = await db.insert(courses).values([{
      title: "Advanced Python Programming",
      description: "Take your Python skills to the next level with advanced concepts including decorators, generators, metaclasses, async programming, and design patterns.",
      category: "programming",
      difficulty: "advanced",
      educatorId: "educator-1",
      modules: 10,
      estimatedHours: 25,
      isPublished: true,
      rating: 4.9,
      xpReward: 200,
    }]).returning();

    console.log("Courses seeded successfully.");

    // Seed Quizzes
    console.log("Seeding quizzes...");
    const [quiz1] = await db.insert(quizzes).values([{
      courseId: course1.id,
      title: "AI Basics Quiz",
      description: "Test your knowledge on the fundamentals of AI.",
      difficulty: "easy",
      timeLimit: 15,
      passingScore: 60,
      isAdaptive: true,
    }]).returning();

    const [quiz2] = await db.insert(quizzes).values([{
      courseId: course2.id,
      title: "React Hooks Challenge",
      description: "A challenging quiz on React Hooks and advanced concepts.",
      difficulty: "medium",
      timeLimit: 20,
      passingScore: 70,
      isAdaptive: true,
    }]).returning();

    const [quiz3] = await db.insert(quizzes).values([{
      courseId: course3.id,
      title: "Data Analysis Fundamentals",
      description: "Test your understanding of core data analysis concepts.",
      difficulty: "easy",
      timeLimit: 15,
      passingScore: 60,
      isAdaptive: true,
    }]).returning();

    const [quiz4] = await db.insert(quizzes).values([{
      courseId: course4.id,
      title: "Linear Algebra Essentials",
      description: "Test your linear algebra skills for machine learning.",
      difficulty: "hard",
      timeLimit: 30,
      passingScore: 75,
      isAdaptive: false,
    }]).returning();

    console.log("Quizzes seeded successfully.");

    // Seed Questions
    console.log("Seeding questions...");

    await db.insert(questions).values([
      {
        courseId: course1.id,
        quizId: quiz1.id,
        content: "What does AI stand for?",
        options: [
          { text: "Artificial Intelligence", isCorrect: true },
          { text: "Automated Integration", isCorrect: false },
          { text: "Advanced Interface", isCorrect: false },
          { text: "Applied Informatics", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "AI Fundamentals",
        explanation: "AI stands for Artificial Intelligence, which is the simulation of human intelligence by machines.",
      },
      {
        courseId: course1.id,
        quizId: quiz1.id,
        content: "Which of the following is a type of machine learning?",
        options: [
          { text: "Supervised Learning", isCorrect: true },
          { text: "Controlled Learning", isCorrect: false },
          { text: "Directed Learning", isCorrect: false },
          { text: "Managed Learning", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Machine Learning Types",
        explanation: "Supervised learning is one of the three main types of machine learning.",
      },
      {
        courseId: course1.id,
        quizId: quiz1.id,
        content: "What is a neural network inspired by?",
        options: [
          { text: "The human brain", isCorrect: true },
          { text: "Computer circuits", isCorrect: false },
          { text: "Social networks", isCorrect: false },
          { text: "The internet", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Neural Networks",
        explanation: "Neural networks are computing systems inspired by the biological neural networks in the human brain.",
      },
      {
        courseId: course1.id,
        quizId: quiz1.id,
        content: "Which company developed the GPT series of language models?",
        options: [
          { text: "OpenAI", isCorrect: true },
          { text: "Google", isCorrect: false },
          { text: "Meta", isCorrect: false },
          { text: "Microsoft", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "AI Companies & Models",
        explanation: "OpenAI developed the GPT (Generative Pre-trained Transformer) series of language models.",
      },
      {
        courseId: course1.id,
        quizId: quiz1.id,
        content: "What is 'overfitting' in machine learning?",
        options: [
          { text: "When a model performs too well on training data but poorly on new data", isCorrect: true },
          { text: "When a model is too simple to capture patterns", isCorrect: false },
          { text: "When training takes too long", isCorrect: false },
          { text: "When the dataset is too large", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "ML Concepts",
        explanation: "Overfitting occurs when a model learns the training data too well, including noise, leading to poor generalization.",
      },
    ]);

    await db.insert(questions).values([
      {
        courseId: course2.id,
        quizId: quiz2.id,
        content: "Which hook is used for managing state in functional components?",
        options: [
          { text: "useState", isCorrect: true },
          { text: "useRef", isCorrect: false },
          { text: "useEffect", isCorrect: false },
          { text: "useContext", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "React Hooks",
        explanation: "useState is the React hook specifically designed for managing state in functional components.",
      },
      {
        courseId: course2.id,
        quizId: quiz2.id,
        content: "When does useEffect run by default?",
        options: [
          { text: "After every render", isCorrect: true },
          { text: "Only on mount", isCorrect: false },
          { text: "Only on unmount", isCorrect: false },
          { text: "Never", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "React Hooks",
        explanation: "Without a dependency array, useEffect runs after every render.",
      },
      {
        courseId: course2.id,
        quizId: quiz2.id,
        content: "What does useMemo do?",
        options: [
          { text: "Memoizes a computed value to avoid unnecessary recalculations", isCorrect: true },
          { text: "Creates a new state variable", isCorrect: false },
          { text: "Manages side effects", isCorrect: false },
          { text: "Creates a ref to a DOM element", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "React Performance",
        explanation: "useMemo memoizes expensive computed values, only recalculating when dependencies change.",
      },
      {
        courseId: course2.id,
        quizId: quiz2.id,
        content: "What is the purpose of useCallback?",
        options: [
          { text: "Memoize a function to prevent unnecessary re-renders", isCorrect: true },
          { text: "Create a callback for async operations", isCorrect: false },
          { text: "Handle errors in components", isCorrect: false },
          { text: "Subscribe to events", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "React Performance",
        explanation: "useCallback returns a memoized callback function that only changes when its dependencies change.",
      },
      {
        courseId: course2.id,
        quizId: quiz2.id,
        content: "What hook would you use to share state across components without prop drilling?",
        options: [
          { text: "useContext", isCorrect: true },
          { text: "useState", isCorrect: false },
          { text: "useRef", isCorrect: false },
          { text: "useReducer", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "React Context",
        explanation: "useContext allows you to consume context values, enabling state sharing across the component tree.",
      },
    ]);

    await db.insert(questions).values([
      {
        courseId: course3.id,
        quizId: quiz3.id,
        content: "What is the primary purpose of data visualization?",
        options: [
          { text: "To communicate information clearly through graphical representation", isCorrect: true },
          { text: "To store data more efficiently", isCorrect: false },
          { text: "To encrypt sensitive data", isCorrect: false },
          { text: "To compress data files", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Data Visualization",
        explanation: "Data visualization uses charts, graphs, and maps to present data in a way that is easy to understand.",
      },
      {
        courseId: course3.id,
        quizId: quiz3.id,
        content: "What is a 'DataFrame' in pandas?",
        options: [
          { text: "A 2-dimensional labeled data structure", isCorrect: true },
          { text: "A type of database", isCorrect: false },
          { text: "A visualization library", isCorrect: false },
          { text: "A machine learning algorithm", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Pandas",
        explanation: "A DataFrame in pandas is a 2-dimensional labeled data structure with columns of potentially different types.",
      },
      {
        courseId: course3.id,
        quizId: quiz3.id,
        content: "What does 'EDA' stand for in data science?",
        options: [
          { text: "Exploratory Data Analysis", isCorrect: true },
          { text: "Extended Data Architecture", isCorrect: false },
          { text: "Efficient Data Algorithm", isCorrect: false },
          { text: "Electronic Data Access", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Data Analysis",
        explanation: "EDA (Exploratory Data Analysis) is an approach to analyzing data sets to summarize their main characteristics.",
      },
      {
        courseId: course3.id,
        quizId: quiz3.id,
        content: "Which measure of central tendency is most affected by outliers?",
        options: [
          { text: "Mean", isCorrect: true },
          { text: "Median", isCorrect: false },
          { text: "Mode", isCorrect: false },
          { text: "Range", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "Statistics",
        explanation: "The mean is most affected by outliers because it takes into account every value in the dataset.",
      },
    ]);

    await db.insert(questions).values([
      {
        courseId: course4.id,
        quizId: quiz4.id,
        content: "What is the result of multiplying a matrix by the identity matrix?",
        options: [
          { text: "The original matrix", isCorrect: true },
          { text: "The zero matrix", isCorrect: false },
          { text: "The transpose of the matrix", isCorrect: false },
          { text: "The inverse of the matrix", isCorrect: false },
        ],
        difficulty: "easy",
        topic: "Matrix Operations",
        explanation: "Multiplying any matrix by the identity matrix returns the original matrix: A × I = A.",
      },
      {
        courseId: course4.id,
        quizId: quiz4.id,
        content: "What is the determinant of a 2x2 matrix [[a,b],[c,d]]?",
        options: [
          { text: "ad - bc", isCorrect: true },
          { text: "ab - cd", isCorrect: false },
          { text: "ac - bd", isCorrect: false },
          { text: "a + d", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "Determinants",
        explanation: "The determinant of a 2x2 matrix [[a,b],[c,d]] is calculated as (a×d) - (b×c).",
      },
      {
        courseId: course4.id,
        quizId: quiz4.id,
        content: "In machine learning, what are eigenvectors used for?",
        options: [
          { text: "Dimensionality reduction (PCA)", isCorrect: true },
          { text: "Sorting data", isCorrect: false },
          { text: "Data cleaning", isCorrect: false },
          { text: "Data encryption", isCorrect: false },
        ],
        difficulty: "hard",
        topic: "Eigenvectors",
        explanation: "Eigenvectors are fundamental to Principal Component Analysis (PCA), a key technique for dimensionality reduction.",
      },
      {
        courseId: course4.id,
        quizId: quiz4.id,
        content: "What is a dot product of two vectors?",
        options: [
          { text: "A scalar value obtained by multiplying corresponding elements and summing them", isCorrect: true },
          { text: "A new vector perpendicular to both", isCorrect: false },
          { text: "The average of both vectors", isCorrect: false },
          { text: "The concatenation of both vectors", isCorrect: false },
        ],
        difficulty: "medium",
        topic: "Vector Operations",
        explanation: "The dot product of two vectors results in a scalar: a·b = Σ(ai × bi).",
      },
    ]);

    console.log("Questions seeded successfully.");
  } else {
    console.log("Courses already seeded.");
  }

  console.log("Seed complete!");
}

seed().catch((error) => {
  console.error("Error during seeding:", error);
  process.exit(1);
});
