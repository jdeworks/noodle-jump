/** Achievement system — pure logic, persistent state. */

import type { PlayerStats } from "../ui/StatsPanel";

const STORAGE_KEY = "noodle-jump-achievements";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (stats: PlayerStats, gameStats?: GameStats) => boolean;
}

/** Per-game stats checked at game over. */
export interface GameStats {
  score: number;
  height: number;
  meatballs: number;
  combo: number;
  zone: number;
  powerUps: number;
  platforms: number;
  seconds: number;
  streak: number;
  enemiesKilled: number;
}

export interface AchievementState {
  unlocked: Set<string>;
}

export const ACHIEVEMENTS: Achievement[] = [
  // First milestones
  { id: "first_flight", name: "First Flight", description: "Collect your first power-up",
    condition: (s) => s.totalGames >= 1 },
  { id: "meatball_10", name: "Meatball Snack", description: "Collect 10 meatballs total",
    condition: (s) => s.totalMeatballs >= 10 },
  { id: "meatball_100", name: "Meatball Mania", description: "Collect 100 meatballs total",
    condition: (s) => s.totalMeatballs >= 100 },
  { id: "meatball_1000", name: "Meatball Mogul", description: "Collect 1000 meatballs total",
    condition: (s) => s.totalMeatballs >= 1000 },

  // Height milestones
  { id: "height_100", name: "Getting Started", description: "Reach height 100",
    condition: (s) => s.bestHeight >= 100 },
  { id: "height_500", name: "Sky High", description: "Reach height 500",
    condition: (s) => s.bestHeight >= 500 },
  { id: "height_1000", name: "Stratosphere", description: "Reach height 1000",
    condition: (s) => s.bestHeight >= 1000 },

  // Zone milestones
  { id: "zone_2", name: "Deep Diver", description: "Reach the Ocean zone",
    condition: (s) => s.maxZone >= 1 },
  { id: "zone_3", name: "Space Chef", description: "Reach Space",
    condition: (s) => s.maxZone >= 2 },
  { id: "zone_4", name: "Ice Cold", description: "Reach the Freezer",
    condition: (s) => s.maxZone >= 3 },
  { id: "zone_5", name: "Hot Stuff", description: "Reach the Volcano",
    condition: (s) => s.maxZone >= 4 },
  { id: "zone_6", name: "Sweet Tooth", description: "Reach Candy World",
    condition: (s) => s.maxZone >= 5 },
  { id: "zone_7", name: "Grand Chef", description: "Reach the Final Kitchen",
    condition: (s) => s.maxZone >= 6 },

  // Combo milestones
  { id: "combo_3x", name: "Combo Starter", description: "Get a 3x combo",
    condition: (s) => s.bestCombo >= 3 },
  { id: "combo_4x", name: "Combo King", description: "Get a 4x combo",
    condition: (s) => s.bestCombo >= 4 },

  // Score milestones
  { id: "score_10k", name: "Ten Grand", description: "Score 10,000 points",
    condition: (s) => s.bestScore >= 10000 },
  { id: "score_50k", name: "Fifty K", description: "Score 50,000 points",
    condition: (s) => s.bestScore >= 50000 },
  { id: "score_100k", name: "Six Figures", description: "Score 100,000 points",
    condition: (s) => s.bestScore >= 100000 },

  // Games played
  { id: "games_10", name: "Regular", description: "Play 10 games",
    condition: (s) => s.totalGames >= 10 },
  { id: "games_50", name: "Dedicated", description: "Play 50 games",
    condition: (s) => s.totalGames >= 50 },

  // Per-game achievements (use gameStats)
  { id: "perfect_start", name: "Perfect Start", description: "Reach height 50 without missing a platform",
    condition: (_, g) => (g?.height ?? 0) >= 50 && (g?.streak ?? 0) >= 10 },
  { id: "enemy_slayer", name: "Enemy Slayer", description: "Kill 5 enemies in one game",
    condition: (_, g) => (g?.enemiesKilled ?? 0) >= 5 },
];

/** Load achievement state from localStorage. */
export function loadAchievements(): AchievementState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { unlocked: new Set(JSON.parse(stored)) };
  } catch {
    // use default
  }
  return { unlocked: new Set() };
}

/** Save achievement state. */
export function saveAchievements(state: AchievementState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.unlocked]));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Check all achievements against current stats.
 * Returns IDs of newly unlocked achievements.
 */
export function checkAchievements(
  state: AchievementState,
  stats: PlayerStats,
  gameStats?: GameStats,
): { state: AchievementState; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (state.unlocked.has(achievement.id)) continue;
    if (achievement.condition(stats, gameStats)) {
      newlyUnlocked.push(achievement.id);
    }
  }

  if (newlyUnlocked.length === 0) {
    return { state, newlyUnlocked };
  }

  const unlocked = new Set(state.unlocked);
  for (const id of newlyUnlocked) {
    unlocked.add(id);
  }

  return { state: { unlocked }, newlyUnlocked };
}

/** Get achievement info by ID. */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
