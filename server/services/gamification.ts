import { storage } from "../storage";
import { Badge } from "@shared/schema";

export interface BadgeCriteria {
  type: 'xp' | 'streak' | 'courses_completed' | 'quiz_score' | 'community_posts';
  value: number;
  comparison: 'gte' | 'eq';
}

export class GamificationService {
  // Default badges to be created on first run
  private defaultBadges: Omit<Badge, 'id' | 'createdAt'>[] = [
    {
      name: "Fire Starter",
      description: "Achieve a 7-day learning streak",
      iconClass: "fas fa-fire",
      color: "#F59E0B",
      criteria: JSON.stringify([{ type: 'streak', value: 7, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 100,
      isActive: true,
    },
    {
      name: "Quiz Master",
      description: "Score 90% or higher on 10 quizzes",
      iconClass: "fas fa-trophy",
      color: "#10B981",
      criteria: JSON.stringify([{ type: 'quiz_score', value: 90, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 200,
      isActive: true,
    },
    {
      name: "Knowledge Seeker",
      description: "Complete your first course",
      iconClass: "fas fa-book",
      color: "#3B82F6",
      criteria: JSON.stringify([{ type: 'courses_completed', value: 1, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 150,
      isActive: true,
    },
    {
      name: "Scholar",
      description: "Complete 5 courses",
      iconClass: "fas fa-graduation-cap",
      color: "#8B5CF6",
      criteria: JSON.stringify([{ type: 'courses_completed', value: 5, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 500,
      isActive: true,
    },
    {
      name: "XP Champion",
      description: "Reach 5,000 XP",
      iconClass: "fas fa-star",
      color: "#F59E0B",
      criteria: JSON.stringify([{ type: 'xp', value: 5000, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 250,
      isActive: true,
    },
    {
      name: "Community Builder",
      description: "Make 10 community posts",
      iconClass: "fas fa-users",
      color: "#06B6D4",
      criteria: JSON.stringify([{ type: 'community_posts', value: 10, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 150,
      isActive: true,
    },
    {
      name: "Streak Legend",
      description: "Achieve a 30-day learning streak",
      iconClass: "fas fa-bolt",
      color: "#EF4444",
      criteria: JSON.stringify([{ type: 'streak', value: 30, comparison: 'gte' }] as BadgeCriteria[]),
      xpReward: 1000,
      isActive: true,
    },
  ];

  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const userAnalytics = await storage.getUserAnalytics(userId);
    const userBadges = await storage.getUserBadges(userId);
    const allBadges = await storage.getBadges();
    
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
    const newlyEarnedBadges: Badge[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = JSON.parse(badge.criteria) as BadgeCriteria[];
      const earnsBadge = criteria.every(criterion => {
        const userValue = this.getUserValueForCriterion(userAnalytics, criterion.type);
        return criterion.comparison === 'gte' 
          ? userValue >= criterion.value
          : userValue === criterion.value;
      });

      if (earnsBadge) {
        await storage.awardBadge(userId, badge.id);
        await storage.updateUserXP(userId, badge.xpReward);
        newlyEarnedBadges.push(badge);
      }
    }

    return newlyEarnedBadges;
  }

  private getUserValueForCriterion(
    analytics: Awaited<ReturnType<typeof storage.getUserAnalytics>>,
    type: BadgeCriteria['type']
  ): number {
    switch (type) {
      case 'xp':
        return analytics.totalXP;
      case 'streak':
        return analytics.streak;
      case 'courses_completed':
        return analytics.coursesCompleted;
      case 'quiz_score':
        return analytics.averageScore;
      case 'community_posts':
        return 0; // Would need to add this to analytics
      default:
        return 0;
    }
  }

  calculateXPForActivity(activity: string, details?: any): number {
    const baseXP = {
      'complete_module': 50,
      'complete_course': 200,
      'complete_quiz': 100,
      'daily_login': 10,
      'community_post': 25,
      'help_others': 15,
    };

    let xp = baseXP[activity as keyof typeof baseXP] || 0;

    // Bonus XP calculations
    if (activity === 'complete_quiz' && details?.score) {
      if (details.score >= 90) xp += 50; // Bonus for high score
      else if (details.score >= 80) xp += 25;
    }

    if (activity === 'daily_login' && details?.streak) {
      // Streak bonus: extra XP for consecutive days
      if (details.streak >= 7) xp += 20;
      if (details.streak >= 30) xp += 50;
    }

    return xp;
  }

  async updateUserProgress(userId: string, activity: string, details?: any): Promise<{
    xpGained: number;
    newBadges: Badge[];
    levelUp?: boolean;
  }> {
    const xpGained = this.calculateXPForActivity(activity, details);
    
    const userBefore = await storage.getUser(userId);
    await storage.updateUserXP(userId, xpGained);
    const userAfter = await storage.getUser(userId);
    
    const levelUp = userBefore && userAfter && userBefore.level < userAfter.level;
    
    // Update streak for daily activities
    if (activity === 'daily_login' || activity === 'complete_module' || activity === 'complete_quiz') {
      await storage.updateUserStreak(userId);
    }

    // Check for new badges
    const newBadges = await this.checkAndAwardBadges(userId);

    return {
      xpGained,
      newBadges,
      levelUp: !!levelUp,
    };
  }

  async getNextLevelRequirement(currentLevel: number): Promise<number> {
    return currentLevel * 1000; // 1000 XP per level
  }

  async calculateCourseCompletionReward(courseId: number): Promise<number> {
    const course = await storage.getCourse(courseId);
    if (!course) return 0;

    let baseReward = 200;
    
    // Difficulty multiplier
    switch (course.difficulty) {
      case 'advanced':
        baseReward *= 1.5;
        break;
      case 'intermediate':
        baseReward *= 1.2;
        break;
      default:
        break;
    }

    // Length multiplier (based on estimated hours)
    if (course.estimatedHours > 10) {
      baseReward *= 1.3;
    }

    return Math.floor(baseReward);
  }
}

export const gamificationService = new GamificationService();
