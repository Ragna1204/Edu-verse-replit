import { storage } from "../storage";

export async function checkAndAwardBadges(userId: string, quizAttempt: any) {
  const allBadges = await storage.getBadges();
  const userBadges = await storage.getUserBadges(userId);
  const userBadgeIds = userBadges.map((b) => b.id);

  for (const badge of allBadges) {
    if (userBadgeIds.includes(badge.id)) {
      continue;
    }

    let shouldAward = false;
    const criteria = badge.criteria as any;

    if (criteria.type === 'first_quiz') {
      const userAttempts = await storage.getUserQuizAttempts(userId);
      if (userAttempts.length === 1) {
        shouldAward = true;
      }
    } else if (criteria.type === 'perfect_score') {
      if (quizAttempt.score === 100) {
        shouldAward = true;
      }
    } else if (criteria.type === 'streak') {
      const user = await storage.getUser(userId);
      if (user && user.streak >= criteria.days) {
        shouldAward = true;
      }
    }

    if (shouldAward) {
      await storage.awardBadge(userId, badge.id);
    }
  }
}
