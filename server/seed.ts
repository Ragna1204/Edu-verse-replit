import 'dotenv/config';
import { db } from "./db";
import { badges, courses, quizzes, users } from "../shared/schema"; // Import courses, quizzes and users

async function seed() {
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length > 0) {
    console.log("Badges already seeded.");
  } else {
    await db.insert(badges).values([
      {
        name: "First Quiz",
        description: "Complete your first quiz.",
        iconClass: "fas fa-flag-checkered",
        type: "milestone",
        criteria: { type: "first_quiz" },
        xpReward: 50,
        rarity: "common",
      },
      {
        name: "Perfectionist",
        description: "Get a perfect score on a quiz.",
        iconClass: "fas fa-bullseye",
        type: "achievement",
        criteria: { type: "perfect_score" },
        xpReward: 100,
        rarity: "rare",
      },
      {
        name: "Streak Starter",
        description: "Maintain a 3-day streak.",
        iconClass: "fas fa-fire",
        type: "streak",
        criteria: { type: "streak", days: 3 },
        xpReward: 75,
        rarity: "common",
      },
    ]);
    console.log("Badges seeded successfully.");
  }

  // Seed Courses
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    // Ensure some users exist for educator references used below
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Seeding default users...");
      await db.insert(users).values([
        {
          id: "replit-user-id-1",
          email: "educator1@example.com",
          firstName: "Educator",
          lastName: "One",
          role: "educator",
          isEducator: true,
        },
        {
          id: "replit-user-id-2",
          email: "educator2@example.com",
          firstName: "Educator",
          lastName: "Two",
          role: "educator",
          isEducator: true,
        },
      ]);
      console.log("Default users seeded.");
    }
    console.log("Seeding courses...");
    const [course1] = await db.insert(courses).values([
      {
        title: "Introduction to AI",
        description: "Learn the basics of Artificial Intelligence and Machine Learning.",
        category: "Technology",
        difficulty: "beginner",
        imageUrl: "https://picsum.photos/seed/ai/800/450",
        educatorId: "replit-user-id-1", // Replace with a valid educator ID if available
        modules: 5,
        estimatedHours: 10,
        isPublished: true,
      },
    ]).returning();

    const [course2] = await db.insert(courses).values([
      {
        title: "Web Development with React",
        description: "Master modern web development using React and its ecosystem.",
        category: "Programming",
        difficulty: "intermediate",
        imageUrl: "https://picsum.photos/seed/react/800/450",
        educatorId: "replit-user-id-1", // Replace with a valid educator ID if available
        modules: 8,
        estimatedHours: 20,
        isPublished: true,
      },
    ]).returning();

    const [course3] = await db.insert(courses).values([
      {
        title: "Data Science Fundamentals",
        description: "Explore the core concepts and tools of Data Science.",
        category: "Data Science",
        difficulty: "beginner",
        imageUrl: "https://picsum.photos/seed/data/800/450",
        educatorId: "replit-user-id-2", // Replace with another valid educator ID
        modules: 6,
        estimatedHours: 15,
        isPublished: true,
      },
    ]).returning();
    console.log("Courses seeded successfully.");

    // Seed Quizzes
    const existingQuizzes = await db.select().from(quizzes);
    if (existingQuizzes.length === 0) {
      console.log("Seeding quizzes...");
      await db.insert(quizzes).values([
        {
          courseId: course1.id,
          title: "AI Basics Quiz",
          description: "Test your knowledge on the fundamentals of AI.",
          difficulty: "easy",
          timeLimit: 15,
          passingScore: 60,
          isAdaptive: true,
        },
        {
          courseId: course2.id,
          title: "React Hooks Challenge",
          description: "A challenging quiz on React Hooks and advanced concepts.",
          difficulty: "hard",
          timeLimit: 30,
          passingScore: 75,
          isAdaptive: false,
        },
      ]);
      console.log("Quizzes seeded successfully.");
    } else {
      console.log("Quizzes already seeded.");
    }
  } else {
    console.log("Courses already seeded.");
  }
}

seed().catch((error) => {
  console.error("Error seeding badges:", error);
  process.exit(1);
});
