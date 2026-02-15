/**
 * Calculates the total XP required to complete a given number of levels.
 * Level 1 requires 100 XP to complete.
 * Level n requires 100 + (n-1)*20 XP to complete.
 * Total XP for L levels = (L/2) * (200 + (L-1)*20) = 10L^2 + 90L
 */
export function calculateTotalXPForLevel(completedLevels: number): number {
    return 10 * Math.pow(completedLevels, 2) + 90 * completedLevels;
}

/**
 * Calculates current level and progress from total XP.
 */
export function calculateLevelFromXP(totalXP: number): {
    level: number;
    currentLevelXP: number;
    xpRequiredForNextLevel: number;
    progressPercentage: number;
} {
    // Solve quadratic: 10L^2 + 90L - TotalXP = 0 for L (completed levels)
    // L = (-90 + sqrt(8100 + 40*TotalXP)) / 20

    if (totalXP < 0) totalXP = 0;

    const discriminant = 8100 + 40 * totalXP;
    const completedLevels = Math.floor((-90 + Math.sqrt(discriminant)) / 20);

    const currentLevel = completedLevels + 1;
    const xpForPreviousLevels = calculateTotalXPForLevel(completedLevels);
    const currentLevelXP = totalXP - xpForPreviousLevels;
    const xpRequiredForNextLevel = 100 + (currentLevel - 1) * 20;

    const progressPercentage = Math.min(100, Math.max(0, (currentLevelXP / xpRequiredForNextLevel) * 100));

    return {
        level: currentLevel,
        currentLevelXP,
        xpRequiredForNextLevel,
        progressPercentage
    };
}
