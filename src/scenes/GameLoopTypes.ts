/** Shared types for the game loop modules. */

import type { GameWorldState } from "./GameState";
import type { PlatformState } from "../entities/Platform";
import type { PowerUpType } from "../entities/PowerUp";

export type GameEvent =
  | {
      type: "landed";
      edgeLanding: boolean;
      platformBroke: boolean;
      x: number;
      y: number;
      platformType: string;
    }
  | { type: "meatballCollected"; count: number; combo: number }
  | {
      type: "powerUpCollected";
      powerUpType: PowerUpType;
      isNegative: boolean;
    }
  | { type: "effectEnded" }
  | { type: "died" }
  | { type: "gameOver"; isNewRecord: boolean }
  | { type: "zoneChanged"; from: number; to: number }
  | { type: "stagnantWarning"; level: 1 | 2 | 3 }
  | { type: "platformCrumbled"; platform: PlatformState }
  | { type: "lasagnaSpawned" }
  | { type: "highScoreBeat" }
  | { type: "landingStreak"; streak: number }
  | { type: "springBounce"; x: number; y: number }
  | { type: "teleported"; fromX: number; fromY: number; toX: number; toY: number }
  | { type: "enemyKilled"; enemyId: number; x: number; y: number }
  | { type: "enemyHitPlayer" }
  | { type: "projectileThrown" }
  | { type: "windGust"; direction: -1 | 1 }
  | { type: "bossSpawned"; bossType: string }
  | { type: "bossDamaged"; health: number; maxHealth: number }
  | { type: "bossKilled"; bossType: string }
  | { type: "bossAttack" }
  | { type: "tentacleGrab"; platformId: number }
  | { type: "comboActive"; multiplier: number };

export interface TickResult {
  state: GameWorldState;
  events: GameEvent[];
}
