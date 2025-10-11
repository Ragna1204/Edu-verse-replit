import { db } from "./db";
import { badges } from "../shared/schema";

async function seed() {
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length > 0) {
    console.log("Badges already seeded.");
    return;
  }

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

seed().catch((error) => {
  console.error("Error seeding badges:", error);
  process.exit(1);
});
