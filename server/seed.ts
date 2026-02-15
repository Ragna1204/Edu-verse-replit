import 'dotenv/config';
import { db } from "./db";
import { badges, courses, quizzes, questions, users, lessons } from "../shared/schema";
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

    // Seed Lessons for each course
    console.log("Seeding lessons...");

    // AI Course Lessons
    await db.insert(lessons).values([
      {
        courseId: course1.id, title: "What is Artificial Intelligence?", type: "reading", order: 1, xpReward: 5, estimatedMinutes: 8,
        content: `## What is Artificial Intelligence?\n\nArtificial Intelligence (AI) is the simulation of human intelligence processes by computer systems. These processes include **learning**, **reasoning**, and **self-correction**.\n\n### Key Concepts\n\n- **Machine Learning (ML)**: A subset of AI that enables systems to learn from data\n- **Deep Learning**: A subset of ML using neural networks with many layers\n- **Natural Language Processing (NLP)**: Enables computers to understand human language\n- **Computer Vision**: Allows machines to interpret visual information\n\n### A Brief History\n\nThe term "Artificial Intelligence" was coined in **1956** at the Dartmouth Conference. Since then, AI has gone through several waves of optimism and "AI winters."\n\nToday, AI powers everyday applications like:\n- Voice assistants (Siri, Alexa)\n- Recommendation systems (Netflix, YouTube)\n- Self-driving cars\n- Medical diagnosis tools\n\n### Types of AI\n\n1. **Narrow AI (ANI)**: Designed for specific tasks (current state)\n2. **General AI (AGI)**: Human-level intelligence (theoretical)\n3. **Super AI (ASI)**: Surpasses human intelligence (hypothetical)\n\n> Most AI systems today are Narrow AI — they excel at specific tasks but cannot generalize across domains.`,
      },
      {
        courseId: course1.id, title: "Understanding Machine Learning", type: "reading", order: 2, xpReward: 5, estimatedMinutes: 10,
        content: `## Understanding Machine Learning\n\nMachine Learning is the backbone of modern AI. Instead of being explicitly programmed, ML systems **learn patterns from data**.\n\n### Three Types of Machine Learning\n\n#### 1. Supervised Learning\nThe model learns from **labeled data** — input-output pairs.\n- **Classification**: Predicting categories (spam vs. not spam)\n- **Regression**: Predicting continuous values (house prices)\n\n#### 2. Unsupervised Learning\nThe model finds patterns in **unlabeled data**.\n- **Clustering**: Grouping similar data points\n- **Dimensionality Reduction**: Simplifying complex data\n\n#### 3. Reinforcement Learning\nThe model learns through **trial and error**, receiving rewards or penalties.\n- Used in game-playing AI, robotics, and resource management\n\n### The ML Pipeline\n\n1. **Data Collection**: Gather relevant data\n2. **Data Preprocessing**: Clean and prepare the data\n3. **Feature Engineering**: Select and transform input variables\n4. **Model Training**: Feed data into the algorithm\n5. **Evaluation**: Test model performance\n6. **Deployment**: Put the model into production\n\n### Common Algorithms\n\n| Algorithm | Type | Use Case |\n|-----------|------|----------|\n| Linear Regression | Supervised | Price prediction |\n| Decision Trees | Supervised | Classification |\n| K-Means | Unsupervised | Customer segmentation |\n| Neural Networks | Both | Image recognition |`,
      },
      {
        courseId: course1.id, title: "AI Fundamentals Quiz", type: "quiz", order: 3, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What is AI primarily about?", options: [{ text: "Simulating human intelligence in machines", isCorrect: true }, { text: "Building faster computers", isCorrect: false }, { text: "Creating humanoid robots", isCorrect: false }, { text: "Replacing all human jobs", isCorrect: false }], explanation: "AI is fundamentally about simulating human intelligence processes like learning, reasoning, and self-correction in computer systems." },
          { question: "Which type of machine learning uses labeled data?", options: [{ text: "Supervised Learning", isCorrect: true }, { text: "Unsupervised Learning", isCorrect: false }, { text: "Reinforcement Learning", isCorrect: false }, { text: "Transfer Learning", isCorrect: false }], explanation: "Supervised learning uses labeled data (input-output pairs) to train models." },
          { question: "What is Deep Learning?", options: [{ text: "A subset of ML using neural networks with many layers", isCorrect: true }, { text: "A type of AI that thinks deeply", isCorrect: false }, { text: "An advanced programming technique", isCorrect: false }, { text: "A database technology", isCorrect: false }], explanation: "Deep Learning uses artificial neural networks with multiple layers (deep networks) to learn complex patterns from data." },
          { question: "What type of AI exists today?", options: [{ text: "Narrow AI (ANI)", isCorrect: true }, { text: "General AI (AGI)", isCorrect: false }, { text: "Super AI (ASI)", isCorrect: false }, { text: "Quantum AI", isCorrect: false }], explanation: "Current AI systems are Narrow AI — they excel at specific tasks but cannot generalize across domains like humans." },
          { question: "Which is NOT a step in the ML pipeline?", options: [{ text: "Code compilation", isCorrect: true }, { text: "Data Collection", isCorrect: false }, { text: "Model Training", isCorrect: false }, { text: "Feature Engineering", isCorrect: false }], explanation: "The ML pipeline includes data collection, preprocessing, feature engineering, model training, evaluation, and deployment — but not code compilation." },
        ]),
      },
      {
        courseId: course1.id, title: "Neural Networks Explained", type: "reading", order: 4, xpReward: 5, estimatedMinutes: 12,
        content: `## Neural Networks Explained\n\nNeural networks are computing systems inspired by the **biological neural networks** in the human brain.\n\n### How They Work\n\nA neural network consists of layers of interconnected **neurons** (nodes):\n\n1. **Input Layer**: Receives the raw data\n2. **Hidden Layers**: Process and transform the data\n3. **Output Layer**: Produces the final result\n\n### Key Components\n\n- **Weights**: Values that determine the strength of connections\n- **Bias**: An additional parameter to adjust the output\n- **Activation Function**: Determines whether a neuron should "fire"\n\n### Common Activation Functions\n\n- **ReLU** (Rectified Linear Unit): Most popular, outputs max(0, x)\n- **Sigmoid**: Outputs values between 0 and 1\n- **Softmax**: Used for multi-class classification\n\n### Training Process\n\nNeural networks learn through **backpropagation**:\n\n1. **Forward Pass**: Data flows through the network to produce output\n2. **Loss Calculation**: Compare prediction to actual value\n3. **Backward Pass**: Adjust weights to minimize loss\n4. **Repeat**: Until the network converges\n\n### Popular Architectures\n\n- **CNN** (Convolutional Neural Networks): Image processing\n- **RNN** (Recurrent Neural Networks): Sequential data\n- **Transformers**: Natural language processing (GPT, BERT)`,
      },
      {
        courseId: course1.id, title: "Natural Language Processing", type: "reading", order: 5, xpReward: 5, estimatedMinutes: 10,
        content: `## Natural Language Processing (NLP)\n\nNLP is the branch of AI that helps computers **understand, interpret, and generate human language**.\n\n### Core NLP Tasks\n\n- **Tokenization**: Breaking text into words or subwords\n- **Named Entity Recognition (NER)**: Identifying names, places, dates\n- **Sentiment Analysis**: Determining emotional tone\n- **Machine Translation**: Converting between languages\n- **Text Summarization**: Creating concise summaries\n\n### Modern NLP: Transformers\n\nThe **Transformer architecture** (introduced in 2017) revolutionized NLP:\n\n- **Attention Mechanism**: Allows the model to focus on relevant parts of input\n- **Self-Attention**: Each word can attend to every other word in the sequence\n- **Parallel Processing**: Unlike RNNs, transformers process all tokens simultaneously\n\n### Large Language Models (LLMs)\n\n| Model | Company | Parameters |\n|-------|---------|------------|\n| GPT-4 | OpenAI | ~1T+ |\n| Gemini | Google | ~1T+ |\n| Claude | Anthropic | Undisclosed |\n| LLaMA | Meta | 7B-70B |\n\n### Applications\n\n- Chatbots and virtual assistants\n- Content generation and writing tools\n- Code completion (GitHub Copilot)\n- Language translation services`,
      },
      {
        courseId: course1.id, title: "Neural Networks & NLP Quiz", type: "quiz", order: 6, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What is backpropagation?", options: [{ text: "The process of adjusting weights by propagating errors backward", isCorrect: true }, { text: "A way to back up neural network data", isCorrect: false }, { text: "Resetting the network to its initial state", isCorrect: false }, { text: "A data preprocessing technique", isCorrect: false }], explanation: "Backpropagation adjusts neural network weights by calculating gradients of the loss function and propagating them backward through the layers." },
          { question: "Which architecture revolutionized NLP?", options: [{ text: "Transformers", isCorrect: true }, { text: "CNNs", isCorrect: false }, { text: "RNNs", isCorrect: false }, { text: "Autoencoders", isCorrect: false }], explanation: "The Transformer architecture, introduced in the 'Attention Is All You Need' paper (2017), revolutionized NLP." },
          { question: "What does ReLU activation function output?", options: [{ text: "max(0, x)", isCorrect: true }, { text: "1 / (1 + e^-x)", isCorrect: false }, { text: "tanh(x)", isCorrect: false }, { text: "x^2", isCorrect: false }], explanation: "ReLU outputs max(0, x) — it returns x if positive, and 0 otherwise." },
          { question: "What is tokenization in NLP?", options: [{ text: "Breaking text into smaller units (words or subwords)", isCorrect: true }, { text: "Encrypting text for security", isCorrect: false }, { text: "Translating text between languages", isCorrect: false }, { text: "Compressing text file size", isCorrect: false }], explanation: "Tokenization splits text into smaller meaningful units called tokens, which can be words, subwords, or characters." },
          { question: "Which layer of a neural network produces the final result?", options: [{ text: "Output Layer", isCorrect: true }, { text: "Input Layer", isCorrect: false }, { text: "Hidden Layer", isCorrect: false }, { text: "Activation Layer", isCorrect: false }], explanation: "The output layer is the final layer in a neural network that produces the prediction or classification result." },
        ]),
      },
    ]);

    // React Course Lessons
    await db.insert(lessons).values([
      {
        courseId: course2.id, title: "React Fundamentals: JSX & Components", type: "reading", order: 1, xpReward: 5, estimatedMinutes: 10,
        content: `## React Fundamentals: JSX & Components\n\nReact is a JavaScript library for building user interfaces. It uses a **component-based architecture** where UIs are built from small, reusable pieces.\n\n### JSX\n\nJSX is a syntax extension that lets you write HTML-like code in JavaScript:\n\n\`\`\`jsx\nfunction Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\`\`\`\n\n### Components\n\nReact components are **JavaScript functions** that return JSX:\n\n\`\`\`jsx\nfunction UserCard({ user }) {\n  return (\n    <div className="card">\n      <h2>{user.name}</h2>\n      <p>{user.email}</p>\n    </div>\n  );\n}\n\`\`\`\n\n### Key Principles\n\n- **Composition**: Build complex UIs from simple components\n- **Declarative**: Describe *what* you want, React handles *how*\n- **One-Way Data Flow**: Data flows from parent to child via props\n\n### Props\n\nProps are how components receive data from their parent:\n\n\`\`\`jsx\n<UserCard user={{ name: "Alice", email: "alice@example.com" }} />\n\`\`\``,
      },
      {
        courseId: course2.id, title: "React Hooks: useState & useEffect", type: "reading", order: 2, xpReward: 5, estimatedMinutes: 12,
        content: `## React Hooks: useState & useEffect\n\nHooks are functions that let you use React features in functional components.\n\n### useState\n\nManages component state:\n\n\`\`\`jsx\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>+1</button>\n    </div>\n  );\n}\n\`\`\`\n\n### useEffect\n\nHandles side effects (API calls, subscriptions, timers):\n\n\`\`\`jsx\nimport { useState, useEffect } from 'react';\n\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  \n  useEffect(() => {\n    fetch(\\\`/api/users/\\\${userId}\\\`)\n      .then(res => res.json())\n      .then(setUser);\n  }, [userId]); // Re-runs when userId changes\n  \n  if (!user) return <p>Loading...</p>;\n  return <h1>{user.name}</h1>;\n}\n\`\`\`\n\n### Dependency Array Rules\n\n- **No array**: Effect runs after every render\n- **Empty array \`[]\`**: Effect runs only on mount\n- **With dependencies \`[dep]\`**: Effect runs when dependencies change\n\n### Cleanup Function\n\n\`\`\`jsx\nuseEffect(() => {\n  const timer = setInterval(() => console.log('tick'), 1000);\n  return () => clearInterval(timer); // Cleanup\n}, []);\n\`\`\``,
      },
      {
        courseId: course2.id, title: "React Basics Quiz", type: "quiz", order: 3, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What is JSX?", options: [{ text: "A syntax extension that lets you write HTML-like code in JavaScript", isCorrect: true }, { text: "A JavaScript framework", isCorrect: false }, { text: "A CSS preprocessor", isCorrect: false }, { text: "A build tool", isCorrect: false }], explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like elements directly in JavaScript code." },
          { question: "What does useState return?", options: [{ text: "An array with the current value and a setter function", isCorrect: true }, { text: "Only the current state value", isCorrect: false }, { text: "A promise that resolves to the state", isCorrect: false }, { text: "An object with state methods", isCorrect: false }], explanation: "useState returns a tuple: [currentValue, setterFunction]. The setter updates the state and triggers a re-render." },
          { question: "When does useEffect(() => {}, []) run?", options: [{ text: "Only on mount (once)", isCorrect: true }, { text: "After every render", isCorrect: false }, { text: "Never", isCorrect: false }, { text: "Only on unmount", isCorrect: false }], explanation: "An empty dependency array [] means the effect runs only once, when the component mounts." },
          { question: "How does data flow in React?", options: [{ text: "One-way (parent to child via props)", isCorrect: true }, { text: "Two-way binding", isCorrect: false }, { text: "Through global variables", isCorrect: false }, { text: "Bottom-up only", isCorrect: false }], explanation: "React uses a unidirectional data flow — data passes from parent to child components through props." },
          { question: "What is a React component?", options: [{ text: "A function that returns JSX", isCorrect: true }, { text: "A CSS class", isCorrect: false }, { text: "An HTML template", isCorrect: false }, { text: "A database query", isCorrect: false }], explanation: "React components are JavaScript functions that accept props and return JSX, describing what should appear on screen." },
        ]),
      },
      {
        courseId: course2.id, title: "Advanced Hooks & State Management", type: "reading", order: 4, xpReward: 5, estimatedMinutes: 12,
        content: `## Advanced Hooks & State Management\n\nBeyond useState and useEffect, React provides several advanced hooks for common patterns.\n\n### useContext\n\nShares data across the component tree without prop drilling:\n\n\`\`\`jsx\nconst ThemeContext = React.createContext('light');\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <Toolbar />\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Toolbar() {\n  const theme = useContext(ThemeContext);\n  return <div className={theme}>Current theme: {theme}</div>;\n}\n\`\`\`\n\n### useReducer\n\nFor complex state logic:\n\n\`\`\`jsx\nfunction reducer(state, action) {\n  switch (action.type) {\n    case 'increment': return { count: state.count + 1 };\n    case 'decrement': return { count: state.count - 1 };\n    default: throw Error('Unknown action');\n  }\n}\n\nfunction Counter() {\n  const [state, dispatch] = useReducer(reducer, { count: 0 });\n  return <button onClick={() => dispatch({ type: 'increment' })}>{state.count}</button>;\n}\n\`\`\`\n\n### useMemo & useCallback\n\n- **useMemo**: Memoize expensive calculations\n- **useCallback**: Memoize function references\n\n\`\`\`jsx\nconst sortedList = useMemo(() => items.sort(), [items]);\nconst handleClick = useCallback(() => doSomething(id), [id]);\n\`\`\``,
      },
      {
        courseId: course2.id, title: "React Routing & API Integration", type: "reading", order: 5, xpReward: 5, estimatedMinutes: 10,
        content: `## React Routing & API Integration\n\n### Client-Side Routing\n\nSingle-page applications need client-side routing. Popular libraries:\n\n\`\`\`jsx\nimport { Route, Switch } from 'wouter';\n\nfunction App() {\n  return (\n    <Switch>\n      <Route path="/">Home</Route>\n      <Route path="/about">About</Route>\n      <Route path="/users/:id">{(params) => <User id={params.id} />}</Route>\n    </Switch>\n  );\n}\n\`\`\`\n\n### API Integration with Fetch\n\n\`\`\`jsx\nfunction useApi(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    fetch(url)\n      .then(res => res.json())\n      .then(setData)\n      .catch(setError)\n      .finally(() => setLoading(false));\n  }, [url]);\n\n  return { data, loading, error };\n}\n\`\`\`\n\n### Best Practices\n\n- **Loading states**: Always show a loading indicator while fetching\n- **Error handling**: Display user-friendly error messages\n- **Data caching**: Use libraries like React Query to cache responses\n- **Optimistic updates**: Update UI immediately, then sync with server`,
      },
      {
        courseId: course2.id, title: "Advanced React Quiz", type: "quiz", order: 6, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What problem does useContext solve?", options: [{ text: "Prop drilling — passing props through many component layers", isCorrect: true }, { text: "State management inside a single component", isCorrect: false }, { text: "CSS styling in React", isCorrect: false }, { text: "API rate limiting", isCorrect: false }], explanation: "useContext provides a way to pass data through the component tree without manually passing props at every level." },
          { question: "When should you use useMemo?", options: [{ text: "When you have an expensive calculation that should only recompute when dependencies change", isCorrect: true }, { text: "Every time you compute a value", isCorrect: false }, { text: "To manage component state", isCorrect: false }, { text: "For side effects", isCorrect: false }], explanation: "useMemo memoizes the result of an expensive computation so it only re-runs when its dependencies change." },
          { question: "What does useReducer return?", options: [{ text: "Current state and a dispatch function", isCorrect: true }, { text: "A single state value", isCorrect: false }, { text: "A ref object", isCorrect: false }, { text: "An effect cleanup function", isCorrect: false }], explanation: "useReducer returns [state, dispatch]. You call dispatch(action) to update state according to your reducer function." },
          { question: "What is React Query used for?", options: [{ text: "Data fetching, caching, and synchronization", isCorrect: true }, { text: "Database queries", isCorrect: false }, { text: "SQL query building", isCorrect: false }, { text: "DOM querying", isCorrect: false }], explanation: "React Query (TanStack Query) handles server-state management including caching, background updates, and synchronization." },
          { question: "What is client-side routing?", options: [{ text: "Navigating between views without full page reloads", isCorrect: true }, { text: "Server-side URL handling", isCorrect: false }, { text: "Network routing protocols", isCorrect: false }, { text: "API endpoint definitions", isCorrect: false }], explanation: "Client-side routing updates the URL and renders different components without requesting a new page from the server." },
        ]),
      },
    ]);

    // Data Science Course Lessons
    await db.insert(lessons).values([
      {
        courseId: course3.id, title: "Introduction to Data Science", type: "reading", order: 1, xpReward: 5, estimatedMinutes: 8,
        content: `## Introduction to Data Science\n\nData Science is an interdisciplinary field that uses **scientific methods, algorithms, and systems** to extract knowledge and insights from data.\n\n### The Data Science Process\n\n1. **Ask Questions**: Define the problem clearly\n2. **Collect Data**: Gather relevant datasets\n3. **Clean Data**: Handle missing values, remove duplicates\n4. **Explore Data**: Visualize patterns and relationships\n5. **Model Data**: Apply statistical or ML techniques\n6. **Communicate Results**: Present findings effectively\n\n### Essential Tools\n\n| Tool | Purpose |\n|------|--------|\n| Python | Programming language |\n| Pandas | Data manipulation |\n| NumPy | Numerical computing |\n| Matplotlib | Data visualization |\n| Scikit-learn | Machine learning |\n| Jupyter | Interactive notebooks |\n\n### Why Data Science Matters\n\nData Science drives decision-making across industries:\n- **Healthcare**: Predicting disease outbreaks\n- **Finance**: Fraud detection\n- **Marketing**: Customer segmentation\n- **Transportation**: Route optimization`,
      },
      {
        courseId: course3.id, title: "Data Analysis with Pandas", type: "reading", order: 2, xpReward: 5, estimatedMinutes: 12,
        content: `## Data Analysis with Pandas\n\nPandas is the most popular Python library for data manipulation and analysis.\n\n### DataFrames\n\nA DataFrame is a 2D labeled data structure:\n\n\`\`\`python\nimport pandas as pd\n\ndf = pd.DataFrame({\n    'Name': ['Alice', 'Bob', 'Charlie'],\n    'Age': [25, 30, 35],\n    'City': ['NYC', 'LA', 'Chicago']\n})\nprint(df)\n\`\`\`\n\n### Common Operations\n\n\`\`\`python\n# Reading data\ndf = pd.read_csv('data.csv')\n\n# Basic info\ndf.shape       # (rows, columns)\ndf.describe()  # Statistical summary\ndf.info()      # Data types and null counts\n\n# Filtering\nolder = df[df['Age'] > 28]\nnyc = df[df['City'] == 'NYC']\n\n# Grouping\ndf.groupby('City')['Age'].mean()\n\n# Handling missing data\ndf.dropna()          # Remove rows with NaN\ndf.fillna(0)         # Replace NaN with 0\n\`\`\`\n\n### Data Types\n\n- **int64/float64**: Numeric data\n- **object**: Strings\n- **datetime64**: Dates and times\n- **category**: Categorical data`,
      },
      {
        courseId: course3.id, title: "Data Science Basics Quiz", type: "quiz", order: 3, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What is the first step in the data science process?", options: [{ text: "Define the problem / Ask questions", isCorrect: true }, { text: "Collect data", isCorrect: false }, { text: "Build a model", isCorrect: false }, { text: "Present results", isCorrect: false }], explanation: "The data science process always starts with clearly defining the problem you're trying to solve." },
          { question: "What is a Pandas DataFrame?", options: [{ text: "A 2D labeled data structure with rows and columns", isCorrect: true }, { text: "A type of database", isCorrect: false }, { text: "A chart type", isCorrect: false }, { text: "A Python class", isCorrect: false }], explanation: "A DataFrame is a two-dimensional, size-mutable, labeled data structure with columns that can hold different data types." },
          { question: "How do you remove rows with missing values in Pandas?", options: [{ text: "df.dropna()", isCorrect: true }, { text: "df.remove_null()", isCorrect: false }, { text: "df.clean()", isCorrect: false }, { text: "df.fillna()", isCorrect: false }], explanation: "dropna() removes rows (or columns) containing missing (NaN) values. fillna() replaces them instead." },
          { question: "Which library is used for numerical computing in Python?", options: [{ text: "NumPy", isCorrect: true }, { text: "Flask", isCorrect: false }, { text: "Django", isCorrect: false }, { text: "Requests", isCorrect: false }], explanation: "NumPy is the fundamental library for numerical computing in Python, providing support for arrays and mathematical functions." },
          { question: "What does df.describe() do?", options: [{ text: "Returns statistical summary of numerical columns", isCorrect: true }, { text: "Describes the data types", isCorrect: false }, { text: "Shows the first 5 rows", isCorrect: false }, { text: "Prints the column names", isCorrect: false }], explanation: "df.describe() generates descriptive statistics (count, mean, std, min, max, quartiles) for numerical columns." },
        ]),
      },
      {
        courseId: course3.id, title: "Data Visualization", type: "reading", order: 4, xpReward: 5, estimatedMinutes: 10,
        content: `## Data Visualization\n\nData visualization transforms data into visual formats that make patterns, trends, and outliers easier to understand.\n\n### Chart Types\n\n- **Bar Charts**: Compare categories\n- **Line Charts**: Show trends over time\n- **Scatter Plots**: Show relationships between variables\n- **Histograms**: Display data distribution\n- **Heatmaps**: Show correlations\n- **Pie Charts**: Show proportions (use sparingly)\n\n### Matplotlib Basics\n\n\`\`\`python\nimport matplotlib.pyplot as plt\n\n# Simple line plot\nplt.plot([1, 2, 3, 4], [10, 20, 25, 30])\nplt.xlabel('X axis')\nplt.ylabel('Y axis')\nplt.title('My First Plot')\nplt.show()\n\`\`\`\n\n### Best Practices\n\n1. **Choose the right chart** for your data type\n2. **Label everything** — axes, title, legend\n3. **Keep it simple** — avoid chart junk\n4. **Use color thoughtfully** — consider colorblind users\n5. **Tell a story** — highlight the key insight`,
      },
      {
        courseId: course3.id, title: "Statistics & Visualization Quiz", type: "quiz", order: 5, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "Which chart type is best for showing trends over time?", options: [{ text: "Line chart", isCorrect: true }, { text: "Pie chart", isCorrect: false }, { text: "Bar chart", isCorrect: false }, { text: "Scatter plot", isCorrect: false }], explanation: "Line charts connect data points with a continuous line, making them ideal for visualizing trends and changes over time." },
          { question: "What does a histogram show?", options: [{ text: "The distribution/frequency of data values", isCorrect: true }, { text: "Correlation between two variables", isCorrect: false }, { text: "Proportions of a whole", isCorrect: false }, { text: "Trends over time", isCorrect: false }], explanation: "Histograms group continuous data into bins and show how frequently values fall into each bin." },
          { question: "Which Python library is commonly used for plotting?", options: [{ text: "Matplotlib", isCorrect: true }, { text: "Flask", isCorrect: false }, { text: "SQLAlchemy", isCorrect: false }, { text: "Requests", isCorrect: false }], explanation: "Matplotlib is the foundational plotting library in Python, used for creating static, animated, and interactive visualizations." },
          { question: "What is a best practice for data visualization?", options: [{ text: "Always label axes and provide a title", isCorrect: true }, { text: "Use as many colors as possible", isCorrect: false }, { text: "Make the chart as complex as possible", isCorrect: false }, { text: "Avoid legends at all costs", isCorrect: false }], explanation: "Clear labeling is essential. Every chart should have labeled axes, a descriptive title, and a legend when needed." },
          { question: "When should pie charts be avoided?", options: [{ text: "When comparing more than 5-6 categories", isCorrect: true }, { text: "Never, pie charts are always best", isCorrect: false }, { text: "When showing proportions", isCorrect: false }, { text: "When data has only 2 categories", isCorrect: false }], explanation: "Pie charts become hard to read with many categories. Bar charts are usually more effective for comparisons." },
        ]),
      },
    ]);

    // Math for ML Course Lessons
    await db.insert(lessons).values([
      {
        courseId: course4.id, title: "Linear Algebra Foundations", type: "reading", order: 1, xpReward: 5, estimatedMinutes: 12,
        content: `## Linear Algebra Foundations\n\nLinear algebra is the **mathematical backbone** of machine learning. Nearly every ML algorithm relies on vectors, matrices, and linear transformations.\n\n### Vectors\n\nA vector is an ordered list of numbers:\n\n- **Notation**: v = [3, 4, 5]\n- **Magnitude**: |v| = √(3² + 4² + 5²)\n- **Unit Vector**: A vector with magnitude 1\n\n### Matrices\n\nA matrix is a 2D array of numbers:\n\n\`\`\`\nA = | 1  2  3 |\n    | 4  5  6 |\n    | 7  8  9 |\n\`\`\`\n\n### Key Operations\n\n- **Dot Product**: a · b = Σ(aᵢ × bᵢ) → produces a scalar\n- **Matrix Multiplication**: (m×n) × (n×p) → (m×p)\n- **Transpose**: Swap rows and columns: A^T\n\n### Applications in ML\n\n| Concept | ML Application |\n|---------|----------------|\n| Vectors | Feature representation |\n| Matrices | Weight parameters |\n| Dot Product | Similarity measure |\n| Eigenvectors | PCA, dimensionality reduction |`,
      },
      {
        courseId: course4.id, title: "Probability & Statistics for ML", type: "reading", order: 2, xpReward: 5, estimatedMinutes: 12,
        content: `## Probability & Statistics for ML\n\nProbability and statistics provide the **theoretical foundation** for making predictions and decisions under uncertainty.\n\n### Key Probability Concepts\n\n- **Probability**: P(A) = Number of favorable outcomes / Total outcomes\n- **Conditional Probability**: P(A|B) = P(A ∩ B) / P(B)\n- **Bayes' Theorem**: P(A|B) = P(B|A) × P(A) / P(B)\n\n### Distributions\n\n- **Normal Distribution**: Bell curve, most common in nature\n- **Bernoulli**: Binary outcomes (coin flip)\n- **Poisson**: Count of events in fixed interval\n\n### Statistical Measures\n\n#### Central Tendency\n- **Mean**: Average of all values\n- **Median**: Middle value when sorted\n- **Mode**: Most frequent value\n\n#### Spread\n- **Variance**: Average squared deviation from mean\n- **Standard Deviation**: Square root of variance\n\n### ML Applications\n\n- **Naive Bayes**: Classification using Bayes' theorem\n- **Gaussian Mixture Models**: Clustering assuming normal distributions\n- **Hypothesis Testing**: Model evaluation and comparison\n- **Confidence Intervals**: Uncertainty estimation`,
      },
      {
        courseId: course4.id, title: "Math Foundations Quiz", type: "quiz", order: 3, xpReward: 15, estimatedMinutes: 12,
        content: JSON.stringify([
          { question: "What does the dot product of two vectors produce?", options: [{ text: "A scalar (single number)", isCorrect: true }, { text: "A new vector", isCorrect: false }, { text: "A matrix", isCorrect: false }, { text: "Nothing", isCorrect: false }], explanation: "The dot product multiplies corresponding elements and sums them, producing a single scalar value." },
          { question: "What is Bayes' Theorem used for?", options: [{ text: "Updating probability based on new evidence", isCorrect: true }, { text: "Calculating matrix inverses", isCorrect: false }, { text: "Differentiating functions", isCorrect: false }, { text: "Sorting data", isCorrect: false }], explanation: "Bayes' Theorem provides a way to update our belief about a hypothesis given new evidence." },
          { question: "What is the standard deviation?", options: [{ text: "Square root of the variance — measures data spread", isCorrect: true }, { text: "The average of all values", isCorrect: false }, { text: "The most frequent value in a dataset", isCorrect: false }, { text: "The range of the data", isCorrect: false }], explanation: "Standard deviation is the square root of the variance and indicates how spread out data points are from the mean." },
          { question: "What is the transpose of a matrix?", options: [{ text: "Swapping rows and columns", isCorrect: true }, { text: "Inverting the matrix", isCorrect: false }, { text: "Multiplying by -1", isCorrect: false }, { text: "Sorting the elements", isCorrect: false }], explanation: "The transpose of a matrix A (written as A^T) swaps its rows and columns." },
          { question: "Which distribution is described as a 'bell curve'?", options: [{ text: "Normal distribution", isCorrect: true }, { text: "Poisson distribution", isCorrect: false }, { text: "Uniform distribution", isCorrect: false }, { text: "Bernoulli distribution", isCorrect: false }], explanation: "The normal (Gaussian) distribution has a characteristic bell shape, symmetric around the mean." },
        ]),
      },
    ]);

    // Python Course Lessons
    await db.insert(lessons).values([
      {
        courseId: course5.id, title: "Advanced Python: Decorators", type: "reading", order: 1, xpReward: 5, estimatedMinutes: 12,
        content: `## Advanced Python: Decorators\n\nDecorators are a powerful Python feature that allow you to **modify or extend the behavior of functions** without changing their code.\n\n### Basic Decorator\n\n\`\`\`python\ndef timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        end = time.time()\n        print(f"{func.__name__} took {end - start:.2f}s")\n        return result\n    return wrapper\n\n@timer\ndef slow_function():\n    import time\n    time.sleep(1)\n    return "Done!"\n\nslow_function()  # Prints: slow_function took 1.00s\n\`\`\`\n\n### Decorator with Arguments\n\n\`\`\`python\ndef repeat(n):\n    def decorator(func):\n        def wrapper(*args, **kwargs):\n            for _ in range(n):\n                result = func(*args, **kwargs)\n            return result\n        return wrapper\n    return decorator\n\n@repeat(3)\ndef greet(name):\n    print(f"Hello, {name}!")\n\`\`\`\n\n### Built-in Decorators\n\n- **@staticmethod**: Method that doesn't need self\n- **@classmethod**: Method that receives cls instead of self\n- **@property**: Access method like an attribute\n- **@functools.lru_cache**: Memoize function results`,
      },
      {
        courseId: course5.id, title: "Generators & Iterators", type: "reading", order: 2, xpReward: 5, estimatedMinutes: 10,
        content: `## Generators & Iterators\n\nGenerators are a special type of function that produce values **lazily** — they yield items one at a time, making them memory-efficient for large datasets.\n\n### Generator Functions\n\n\`\`\`python\ndef fibonacci():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\n# Use it\nfib = fibonacci()\nfor _ in range(10):\n    print(next(fib))  # 0, 1, 1, 2, 3, 5, 8, 13, 21, 34\n\`\`\`\n\n### Generator Expressions\n\n\`\`\`python\n# List comprehension (all in memory)\nsquares_list = [x**2 for x in range(1000000)]\n\n# Generator expression (lazy, memory efficient)\nsquares_gen = (x**2 for x in range(1000000))\n\`\`\`\n\n### The Iterator Protocol\n\n\`\`\`python\nclass Countdown:\n    def __init__(self, start):\n        self.start = start\n    \n    def __iter__(self):\n        return self\n    \n    def __next__(self):\n        if self.start <= 0:\n            raise StopIteration\n        self.start -= 1\n        return self.start + 1\n\nfor num in Countdown(5):\n    print(num)  # 5, 4, 3, 2, 1\n\`\`\`\n\n### When to Use Generators\n\n- **Large datasets**: Process millions of records without loading all into memory\n- **Pipelines**: Chain transformations lazily\n- **Infinite sequences**: Generate values on-demand`,
      },
      {
        courseId: course5.id, title: "Python Advanced Features Quiz", type: "quiz", order: 3, xpReward: 15, estimatedMinutes: 10,
        content: JSON.stringify([
          { question: "What does the @decorator syntax do?", options: [{ text: "Wraps a function to modify or extend its behavior", isCorrect: true }, { text: "Makes a function private", isCorrect: false }, { text: "Compiles the function to C", isCorrect: false }, { text: "Deletes the function after use", isCorrect: false }], explanation: "The @decorator syntax is syntactic sugar for func = decorator(func). It wraps a function to add behavior." },
          { question: "What is the benefit of generators over lists?", options: [{ text: "Memory efficiency — values are produced lazily one at a time", isCorrect: true }, { text: "They are faster for random access", isCorrect: false }, { text: "They can store more data types", isCorrect: false }, { text: "They are easier to sort", isCorrect: false }], explanation: "Generators produce values on-demand (lazily), so they don't need to store all values in memory at once." },
          { question: "What does the 'yield' keyword do?", options: [{ text: "Pauses the function and returns a value, resuming on next call", isCorrect: true }, { text: "Permanently exits the function", isCorrect: false }, { text: "Returns None", isCorrect: false }, { text: "Raises an exception", isCorrect: false }], explanation: "yield pauses the generator function, remembers its state, and produces a value. Execution resumes from where it left off on the next next() call." },
          { question: "What does @property decorator do?", options: [{ text: "Lets you access a method as if it were an attribute", isCorrect: true }, { text: "Makes a variable constant", isCorrect: false }, { text: "Creates a class property in CSS", isCorrect: false }, { text: "Adds the method to the class documentation", isCorrect: false }], explanation: "@property allows you to define methods that can be accessed like attributes, enabling getters and setters." },
          { question: "What protocol must a class implement to be iterable?", options: [{ text: "__iter__ and __next__", isCorrect: true }, { text: "__len__ and __getitem__", isCorrect: false }, { text: "__str__ and __repr__", isCorrect: false }, { text: "__enter__ and __exit__", isCorrect: false }], explanation: "An iterator must implement __iter__ (returns self) and __next__ (returns next value or raises StopIteration)." },
        ]),
      },
    ]);

    console.log("Lessons seeded successfully.");
  } else {
    console.log("Courses already seeded.");
  }

  console.log("Seed complete!");
}

seed().catch((error) => {
  console.error("Error during seeding:", error);
  process.exit(1);
});
