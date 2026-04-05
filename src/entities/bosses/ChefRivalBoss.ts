/** Chef Rival — jumps between platforms chasing the player. Contact kills. */

import { random } from "../../systems/RNG";
import { GAME_WIDTH, GAME_HEIGHT } from "../../config/constants";
import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";
import type { BossBehavior, BossState, BossTickResult } from "./BossInterface";

const WIDTH = 36;
const HEIGHT = 44;
const HEALTH = 3;
const PREVIEW_TICKS = 120; // 2 seconds of arc preview before jumping
const BASE_JUMP_COOLDOWN = PREVIEW_TICKS + 30; // total cooldown includes preview
const MIN_JUMP_COOLDOWN = PREVIEW_TICKS + 15;
const ARC_HEIGHT = 120;
const ARC_DURATION = 40;

export const chefRivalBehavior: BossBehavior = {
  create(cameraY: number, platforms?: PlatformState[]): BossState {
    let x = GAME_WIDTH / 2 - WIDTH / 2;
    let y = cameraY + 40;
    let currentPlatformId: number | null = null;

    if (platforms && platforms.length > 0) {
      // Pick the topmost (lowest Y) non-broken platform in the visible arena
      const visible = platforms
        .filter(
          (p) => !p.broken && p.y >= cameraY && p.y < cameraY + GAME_HEIGHT,
        )
        .sort((a, b) => a.y - b.y);
      if (visible.length > 0) {
        const plat = visible[0]; // topmost
        x = plat.x + plat.width / 2 - WIDTH / 2;
        y = plat.y - HEIGHT;
        currentPlatformId = plat.id;
      }
    }

    return {
      type: "chef_rival",
      x,
      y,
      width: WIDTH,
      height: HEIGHT,
      health: HEALTH,
      maxHealth: HEALTH,
      phase: 0,
      alive: true,
      patternTick: 0,
      currentPlatformId,
      jumpCooldown: BASE_JUMP_COOLDOWN,
      vy: 0,
    };
  },

  tick(
    boss: BossState,
    player: PlayerState,
    platforms: PlatformState[],
    _animTick: number,
    speedScale = 1,
    attackMultiplier = 1,
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let {
      x,
      y,
      vy,
      jumpCooldown,
      currentPlatformId,
      patternTick,
      jumpArc,
      visitedPlatformIds,
    } = boss;
    const visited = visitedPlatformIds ?? [];
    const breakIds: number[] = [];
    patternTick += speedScale;

    // ── Move with current platform (moving platforms) — while standing or previewing ──
    const isInPreview = jumpArc != null && jumpArc.progress < 0;
    if (currentPlatformId != null && (!jumpArc || isInPreview)) {
      const curPlat = platforms.find((p) => p.id === currentPlatformId);
      if (curPlat && !curPlat.broken && curPlat.type === "moving") {
        x = curPlat.x + curPlat.width / 2 - boss.width / 2;
        y = curPlat.y - boss.height;
      }
    }

    // ── Arc movement: boss follows a parabolic curve ──
    const isJumping =
      jumpArc != null && jumpArc.progress >= 0 && jumpArc.progress < 1;
    if (isJumping) {
      const t = jumpArc!.progress;
      // For moving platform targets, update target position in real-time
      const targetPlat = platforms.find(
        (p) => p.id === jumpArc!.targetPlatformId,
      );
      let tgtX = jumpArc!.targetX;
      let tgtY = jumpArc!.targetY;
      if (targetPlat && !targetPlat.broken) {
        tgtX = targetPlat.x + targetPlat.width / 2 - boss.width / 2;
        tgtY = targetPlat.y - boss.height;
      }

      x = jumpArc!.startX + (tgtX - jumpArc!.startX) * t;
      const midY = (jumpArc!.startY + tgtY) / 2;
      const peakY = midY - ARC_HEIGHT;
      const invT = 1 - t;
      y = invT * invT * jumpArc!.startY + 2 * invT * t * peakY + t * t * tgtY;
      jumpArc = {
        ...jumpArc!,
        targetX: tgtX,
        targetY: tgtY,
        progress: t + speedScale / jumpArc!.duration,
      };
      vy = 0;

      if (jumpArc!.progress >= 1) {
        x = tgtX;
        y = tgtY;
        vy = 0;
        jumpArc = undefined;
      }
    }

    // ── Update preview arc start + target for moving platforms ──
    if (jumpArc && jumpArc.progress < 0) {
      // Keep arc start at boss's current position (follows moving platform)
      jumpArc = { ...jumpArc, startX: x, startY: y };
      if (jumpArc.targetPlatformId != null) {
        const tpId = jumpArc.targetPlatformId;
        const targetPlat = platforms.find((p) => p.id === tpId);
        if (targetPlat && !targetPlat.broken) {
          jumpArc = {
            ...jumpArc,
            targetX: targetPlat.x + targetPlat.width / 2 - boss.width / 2,
            targetY: targetPlat.y - boss.height,
          };
        }
      }
    }

    // ── Cooldown and jump planning ──
    const cooldown = jumpCooldown & 0xffff;
    const jumpCount = jumpCooldown >> 16;
    const newCooldown = Math.max(0, cooldown - speedScale);
    const newCooldownInt = Math.max(0, Math.round(newCooldown));
    const onGround = !isJumping;
    if (onGround) {
      // At PREVIEW_TICKS: pick target, show preview arc
      if (
        cooldown > PREVIEW_TICKS &&
        newCooldown <= PREVIEW_TICKS &&
        !jumpArc
      ) {
        const allValid = platforms.filter(
          (p) =>
            !p.broken &&
            p.id !== currentPlatformId &&
            p.id !== jumpArc?.targetPlatformId,
        );

        let candidates = allValid.filter((p) => !visited.includes(p.id));
        let newVisited = visited;
        if (candidates.length === 0) {
          candidates = allValid;
          newVisited = [];
        }

        if (candidates.length > 0) {
          const newJumpCount = jumpCount + 1;
          let target: PlatformState;

          if (random() < 0.25) {
            const byPlayer = [...candidates].sort((a, b) => {
              const da =
                Math.abs(a.x + a.width / 2 - player.x) +
                Math.abs(a.y - player.y);
              const db =
                Math.abs(b.x + b.width / 2 - player.x) +
                Math.abs(b.y - player.y);
              return da - db;
            });
            target = byPlayer[0];
          } else {
            target = candidates[Math.floor(random() * candidates.length)];
          }

          const targetX = target.x + target.width / 2 - boss.width / 2;
          const targetY = target.y - boss.height;
          jumpArc = {
            startX: x,
            startY: y,
            targetX,
            targetY,
            progress: -1,
            duration: ARC_DURATION,
            targetPlatformId: target.id,
          };
          visitedPlatformIds = [...newVisited, target.id];
          jumpCooldown = (newJumpCount << 16) | newCooldownInt;
        } else {
          jumpCooldown = (jumpCount << 16) | newCooldownInt;
        }
      }
      // At 0: start the actual jump — break crumbling/brittle platform on departure
      else if (
        cooldown > 0 &&
        newCooldown <= 0 &&
        jumpArc &&
        jumpArc.progress < 0
      ) {
        // Break the platform the boss is leaving if it's breakable
        if (currentPlatformId != null) {
          const leavingPlat = platforms.find((p) => p.id === currentPlatformId);
          if (
            leavingPlat &&
            (leavingPlat.type === "breaking" ||
              leavingPlat.type === "brittle" ||
              leavingPlat.type === "crumbling")
          ) {
            breakIds.push(currentPlatformId);
          }
        }
        // Now transfer to the target platform
        currentPlatformId = jumpArc.targetPlatformId ?? null;
        jumpArc = { ...jumpArc, startX: x, startY: y, progress: 0 };
        const baseCd = Math.max(
          MIN_JUMP_COOLDOWN,
          BASE_JUMP_COOLDOWN - boss.phase * 10,
        );
        const cd = Math.max(30, Math.ceil(baseCd / attackMultiplier));
        jumpCooldown = (jumpCount << 16) | cd;
      } else {
        jumpCooldown = (jumpCount << 16) | newCooldownInt;
      }
    }

    x = Math.max(0, Math.min(GAME_WIDTH - boss.width, x));

    // Safety: if boss is off screen and not on a valid platform, teleport
    const arenaBottom = player.y + GAME_HEIGHT * 0.5 + 50;
    const onValidPlatform =
      currentPlatformId != null &&
      platforms.some((p) => p.id === currentPlatformId && !p.broken);
    if (!jumpArc && !onValidPlatform && y > arenaBottom) {
      const rescue = platforms
        .filter((p) => !p.broken && Math.abs(p.y - player.y) < 200)
        .sort((a, b) => a.y - b.y);
      if (rescue.length > 0) {
        const p = rescue[Math.floor(rescue.length / 2)];
        x = p.x + p.width / 2 - boss.width / 2;
        y = p.y - boss.height;
        vy = 0;
        currentPlatformId = p.id;
      }
    }

    return {
      boss: {
        ...boss,
        x,
        y,
        vy,
        jumpCooldown,
        currentPlatformId,
        patternTick,
        jumpArc,
        visitedPlatformIds,
      },
      attacks: [],
      breakPlatformIds: breakIds.length > 0 ? breakIds : undefined,
    };
  },

  checkPlayerContact(boss: BossState, player: PlayerState): boolean {
    if (!boss.alive) return false;
    const pad = 4;
    return (
      player.x + player.width - pad > boss.x &&
      player.x + pad < boss.x + boss.width &&
      player.y + player.height - pad > boss.y &&
      player.y + pad < boss.y + boss.height
    );
  },
};
