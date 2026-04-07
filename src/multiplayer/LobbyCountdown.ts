/**
 * Host-side countdown timer and clock-offset start sequence.
 * Extracted from LobbyScreen to stay under LOC budget and support host migration.
 */

import type { GameSync } from "./GameSync";
import type { RemoteCosmetics } from "./RemotePlayerRenderer";
import type { RunConfig } from "../systems/CustomRunConfig";
import { loadRunConfigFromStorage, loadDebugConfigFromStorage } from "../ui/CustomRunStorage";
import { setDebugConfig } from "../config/debug";
import { loadCosmetics } from "../systems/Cosmetics";

export interface LobbyPlayer {
  peerId: string;
  character: string;
  cosmetics: RemoteCosmetics;
  ready: boolean;
  colorIndex: number;
  name: string;
  announced: boolean;
  lastHeartbeat: number;
}

export type StartCallback = (
  seed: number,
  mode: string,
  touchControls: boolean,
  remotePeers: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>,
  sharedRunConfig?: RunConfig,
) => void;

export interface CountdownDeps {
  sync: GameSync;
  getRemotePlayers: () => Map<string, LobbyPlayer>;
  getLocalReady: () => boolean;
  getLocalState: () => {
    mode: string;
    localChar: string;
    localName: string;
    selectedTheme: string;
    touchControls: boolean;
    useCustomRun: boolean;
  };
  setCountdownText: (text: string) => void;
  onStart: StartCallback;
}

function serializeForSync(cfg: RunConfig): Record<string, unknown> {
  return { ...cfg, enabledPowerUps: [...cfg.enabledPowerUps] };
}

const COUNTDOWN_LONG = 15_000;
const COUNTDOWN_SHORT = 3_000;
export { COUNTDOWN_LONG, COUNTDOWN_SHORT };

export class LobbyCountdown {
  starting = false;
  countdownEndTime = -1;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private pendingSeed = 0;
  private pendingRunCfg: RunConfig | null = null;
  private preparedPeers = new Set<string>();
  private peerOffsets = new Map<string, number>();
  private startTimeout: ReturnType<typeof setTimeout> | null = null;
  private prepareSentAt = 0;
  private barrierTimeout: ReturnType<typeof setTimeout> | null = null;
  private deps: CountdownDeps;

  constructor(deps: CountdownDeps) {
    this.deps = deps;
  }

  evaluate(): void {
    if (this.starting) return;
    const rp = this.deps.getRemotePlayers();
    const lr = this.deps.getLocalReady();
    const hr = rp.size > 0;
    const all = lr && hr && [...rp.values()].every((p) => p.ready);
    if (all) {
      if (this.countdownEndTime < 0) this.setCountdown(COUNTDOWN_SHORT);
      else if (this.countdownEndTime - performance.now() > COUNTDOWN_SHORT)
        this.setCountdown(COUNTDOWN_SHORT);
    } else if (lr && hr && this.countdownEndTime < 0) {
      this.setCountdown(COUNTDOWN_LONG);
    } else if (!lr) {
      this.setCountdown(0);
    }
  }

  setCountdown(durationMs: number): void {
    this.cancelTimer();
    if (durationMs <= 0) {
      this.countdownEndTime = -1;
      this.deps.setCountdownText("");
      this.deps.sync.sendGameEvent({ type: "zone", payload: { countdown: 0 } });
      return;
    }
    this.countdownEndTime = performance.now() + durationMs;
    this.countdownInterval = setInterval(() => this.tick(), 100);
    this.deps.sync.sendGameEvent({
      type: "zone",
      payload: { countdown: Math.ceil(durationMs / 1000) },
    });
  }

  private tick(): void {
    if (this.starting) return;
    const remain = Math.max(0, this.countdownEndTime - performance.now());
    const secs = Math.ceil(remain / 1000);
    this.deps.setCountdownText(secs > 0 ? `Starting in ${secs}...` : "");
    if (remain <= 0) this.doStart();
  }

  cancelTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /** Hard reset — clears all state for host migration. */
  abort(): void {
    this.cancelTimer();
    this.starting = false;
    this.countdownEndTime = -1;
    this.deps.setCountdownText("");
    this.preparedPeers.clear();
    this.peerOffsets.clear();
    if (this.barrierTimeout) {
      clearTimeout(this.barrierTimeout);
      this.barrierTimeout = null;
    }
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }
  }

  /**
   * Clock-offset sync: host measures each guest's clock offset, picks a shared start time,
   * and tells each guest when to start in THEIR local clock.
   */
  doStart(): void {
    this.starting = true;
    this.cancelTimer();
    this.deps.setCountdownText("Syncing...");
    const ls = this.deps.getLocalState();
    this.pendingSeed = Math.floor(Math.random() * 0xffffffff);
    this.pendingRunCfg = ls.useCustomRun ? loadRunConfigFromStorage() : null;
    const dc = ls.useCustomRun ? loadDebugConfigFromStorage() : null;
    if (dc) setDebugConfig(dc);
    this.preparedPeers = new Set();
    this.peerOffsets = new Map();
    this.prepareSentAt = Date.now();
    const cos = loadCosmetics();
    this.deps.sync.sendGameEvent({
      type: "start",
      payload: {
        phase: "prepare",
        seed: this.pendingSeed,
        mode: ls.mode,
        touchControls: ls.touchControls,
        character: ls.localChar,
        name: ls.localName,
        theme: ls.selectedTheme,
        tint: cos.equipped.tint ?? "tint_none",
        trail: cos.equipped.trail ?? "trail_none",
        hostTime: this.prepareSentAt,
        runCfg: this.pendingRunCfg ? serializeForSync(this.pendingRunCfg) : null,
        dbgCfg: dc,
      },
    });
    this.barrierTimeout = setTimeout(() => this.sendGoWithOffsets(), 2000);
  }

  onPrepared(peerId: string, guestTime: number): void {
    this.preparedPeers.add(peerId);
    const rtt = Date.now() - this.prepareSentAt;
    this.peerOffsets.set(peerId, guestTime - this.prepareSentAt - rtt / 2);
    const rp = this.deps.getRemotePlayers();
    if (this.preparedPeers.size >= rp.size) {
      if (this.barrierTimeout) {
        clearTimeout(this.barrierTimeout);
        this.barrierTimeout = null;
      }
      this.sendGoWithOffsets();
    }
  }

  private sendGoWithOffsets(): void {
    if (this.barrierTimeout) {
      clearTimeout(this.barrierTimeout);
      this.barrierTimeout = null;
    }
    const startAt = Math.ceil((Date.now() + 1000) / 1000) * 1000;
    const ps: Record<string, number> = {};
    for (const [id, off] of this.peerOffsets) ps[id] = startAt + off;
    this.deps.sync.sendGameEvent({
      type: "start",
      payload: { phase: "go", startAt, peerStartAt: ps },
    });
    this.deps.setCountdownText("GO!");
    const ls = this.deps.getLocalState();
    const rp = new Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>();
    for (const [id, p] of this.deps.getRemotePlayers())
      rp.set(id, {
        character: p.character,
        cosmetics: { ...p.cosmetics, theme: ls.selectedTheme },
        name: p.name,
      });
    this.startTimeout = setTimeout(() => {
      this.startTimeout = null;
      this.deps.onStart(
        this.pendingSeed,
        ls.mode,
        ls.touchControls,
        rp,
        this.pendingRunCfg ? { ...this.pendingRunCfg, seed: this.pendingSeed } : undefined,
      );
    }, Math.max(0, startAt - Date.now()));
  }

  destroy(): void {
    this.abort();
  }
}
