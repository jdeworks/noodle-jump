/**
 * Multiplayer session — manages two game states with a shared seed.
 * Pure logic layer, no rendering. Tracks game mode, death/ghost state, winner.
 */

import { createInitialState, type GameWorldState } from "../scenes/GameState";
import { tickGameWorld, startCountdown } from "../scenes/GameLoop";
import type { GameEvent } from "../scenes/GameLoopTypes";
import type { RunConfig } from "../systems/CustomRunConfig";
import { createDefaultRunConfig } from "../systems/CustomRunConfig";

export type MultiplayerMode = "best-height";
export type PlayerStatus = "alive" | "dead" | "ghost";

export interface PlayerResult {
  height: number;
  score: number;
  platformsPassed: number;
  meatballsCollected: number;
  status: PlayerStatus;
  deathHeight: number;
}

export interface MultiplayerResult {
  winner: 1 | 2 | "tie";
  p1: PlayerResult;
  p2: PlayerResult;
}

export class MultiplayerSession {
  private _p1State: GameWorldState;
  private _p2State: GameWorldState;
  private _p1Status: PlayerStatus = "alive";
  private _p2Status: PlayerStatus = "alive";
  private _p1DeathHeight = 0;
  private _p2DeathHeight = 0;
  private _mode: MultiplayerMode;
  private _gameOver = false;
  private _p1Events: GameEvent[] = [];
  private _p2Events: GameEvent[] = [];

  constructor(seed: number, mode: MultiplayerMode = "best-height") {
    this._mode = mode;

    // Both players use identical run config with the same seed
    const config: RunConfig = {
      ...createDefaultRunConfig(),
      seed,
    };

    // Create states sequentially — initRNG is global, so we need to
    // create p1 state, save it, then re-init for p2 with same seed.
    // Since createInitialState calls initRNG internally, the second call
    // resets the RNG to the same seed, producing an identical world.
    this._p1State = createInitialState(config);
    this._p2State = createInitialState(config);
  }

  get p1State(): GameWorldState {
    return this._p1State;
  }
  get p2State(): GameWorldState {
    return this._p2State;
  }
  get p1Status(): PlayerStatus {
    return this._p1Status;
  }
  get p2Status(): PlayerStatus {
    return this._p2Status;
  }
  get mode(): MultiplayerMode {
    return this._mode;
  }
  get gameOver(): boolean {
    return this._gameOver;
  }
  get p1Events(): GameEvent[] {
    return this._p1Events;
  }
  get p2Events(): GameEvent[] {
    return this._p2Events;
  }

  startCountdown(): void {
    this._p1State = startCountdown(this._p1State);
    this._p2State = startCountdown(this._p2State);
  }

  /**
   * Tick both game worlds. Each player gets their own input.
   * Returns true if the game just ended this tick.
   */
  tick(p1InputX: number, p2InputX: number): boolean {
    if (this._gameOver) return false;

    // Tick player 1
    if (this._p1Status === "alive" || this._p1Status === "ghost") {
      const r1 = tickGameWorld(this._p1State, p1InputX);
      this._p1State = r1.state;
      this._p1Events = r1.events;

      // Check for death
      if (this._p1Status === "alive" && this._p1State.isDying) {
        this._p1DeathHeight = this._p1State.scoreState.height;
      }
      if (this._p1Status === "alive" && this._p1State.gameOver) {
        this._p1Status = "ghost";
      }
    } else {
      this._p1Events = [];
    }

    // Tick player 2
    if (this._p2Status === "alive" || this._p2Status === "ghost") {
      const r2 = tickGameWorld(this._p2State, p2InputX);
      this._p2State = r2.state;
      this._p2Events = r2.events;

      if (this._p2Status === "alive" && this._p2State.isDying) {
        this._p2DeathHeight = this._p2State.scoreState.height;
      }
      if (this._p2Status === "alive" && this._p2State.gameOver) {
        this._p2Status = "ghost";
      }
    } else {
      this._p2Events = [];
    }

    // Check if game is over (both players dead/ghost and both game over)
    if (this._p1State.gameOver && this._p2State.gameOver) {
      this._gameOver = true;
      return true;
    }

    return false;
  }

  /** Get the final results. Only valid when gameOver is true. */
  getResult(): MultiplayerResult {
    const p1: PlayerResult = {
      height: this._p1DeathHeight || this._p1State.scoreState.height,
      score: this._p1State.scoreState.points,
      platformsPassed: this._p1State.platformsPassed,
      meatballsCollected: this._p1State.scoreState.meatballsCollected,
      status: this._p1Status,
      deathHeight: this._p1DeathHeight,
    };

    const p2: PlayerResult = {
      height: this._p2DeathHeight || this._p2State.scoreState.height,
      score: this._p2State.scoreState.points,
      platformsPassed: this._p2State.platformsPassed,
      meatballsCollected: this._p2State.scoreState.meatballsCollected,
      status: this._p2Status,
      deathHeight: this._p2DeathHeight,
    };

    let winner: 1 | 2 | "tie";
    if (p1.height > p2.height) winner = 1;
    else if (p2.height > p1.height) winner = 2;
    else winner = "tie";

    return { winner, p1, p2 };
  }

  /** Check if a specific player just died this tick. */
  playerJustDied(player: 1 | 2): boolean {
    const events = player === 1 ? this._p1Events : this._p2Events;
    return events.some((e) => e.type === "died");
  }

  /** Get the death height for a player (for toast notification). */
  getDeathHeight(player: 1 | 2): number {
    return player === 1 ? this._p1DeathHeight : this._p2DeathHeight;
  }
}
