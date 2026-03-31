/** Persistent player stats — stored in localStorage across sessions. */

const STATS_KEY = "noodle-jump-player-stats";

export interface PlayerStats {
  totalGames: number;
  totalMeatballs: number;
  bestHeight: number;
  bestScore: number;
  bestCombo: number;
  maxZone: number;
  totalPlayTimeSeconds: number;
}

function defaultStats(): PlayerStats {
  return {
    totalGames: 0,
    totalMeatballs: 0,
    bestHeight: 0,
    bestScore: 0,
    bestCombo: 0,
    maxZone: 0,
    totalPlayTimeSeconds: 0,
  };
}

export function loadStats(): PlayerStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) return { ...defaultStats(), ...JSON.parse(stored) };
  } catch {
    // use defaults
  }
  return defaultStats();
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // localStorage may be unavailable
  }
}

/** Update stats after a game ends. */
export function updateStatsAfterGame(
  stats: PlayerStats,
  gameResult: {
    score: number;
    height: number;
    meatballs: number;
    combo: number;
    zone: number;
    seconds: number;
  },
): PlayerStats {
  return {
    totalGames: stats.totalGames + 1,
    totalMeatballs: stats.totalMeatballs + gameResult.meatballs,
    bestHeight: Math.max(stats.bestHeight, gameResult.height),
    bestScore: Math.max(stats.bestScore, gameResult.score),
    bestCombo: Math.max(stats.bestCombo, gameResult.combo),
    maxZone: Math.max(stats.maxZone, gameResult.zone),
    totalPlayTimeSeconds: stats.totalPlayTimeSeconds + gameResult.seconds,
  };
}
