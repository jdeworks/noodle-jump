import { describe, test, expect } from "vitest";
import { chefRivalBehavior } from "../src/entities/bosses/ChefRivalBoss";
import { krakenBehavior, applyTentacleAttack } from "../src/entities/bosses/KrakenBoss";
import { ufoBehavior } from "../src/entities/bosses/UFOBoss";
import { getBossBehavior, getAllBossTypes, getBossForZone } from "../src/entities/bosses/index";
import { createPlayer } from "../src/entities/Player";
import type { PlatformState } from "../src/entities/Platform";

function makePlatform(overrides: Partial<PlatformState> = {}): PlatformState {
  return {
    x: 100, y: 300, width: 100, height: 15,
    type: "static", broken: false, id: 1,
    originX: 100, moveDirection: 1,
    ...overrides,
  };
}

describe("Boss behavior interface", () => {
  test("getAllBossTypes returns all registered types", () => {
    const types = getAllBossTypes();
    expect(types).toContain("chef_rival");
    expect(types).toContain("kraken");
    expect(types).toContain("ufo");
    expect(types.length).toBe(3);
  });

  test("getBossBehavior returns correct module for each type", () => {
    expect(getBossBehavior("chef_rival")).toBe(chefRivalBehavior);
    expect(getBossBehavior("kraken")).toBe(krakenBehavior);
    expect(getBossBehavior("ufo")).toBe(ufoBehavior);
  });

  test("getBossBehavior returns undefined for unknown type", () => {
    expect(getBossBehavior("nonexistent")).toBeUndefined();
  });

  test("getBossForZone maps correctly", () => {
    expect(getBossForZone(2)).toBe("chef_rival");
    expect(getBossForZone(4)).toBe("kraken");
    expect(getBossForZone(6)).toBe("ufo");
    expect(getBossForZone(0)).toBeNull();
  });
});

describe("ChefRivalBoss behavior", () => {
  test("create returns valid state", () => {
    const boss = chefRivalBehavior.create(-500);
    expect(boss.type).toBe("chef_rival");
    expect(boss.health).toBe(3);
    expect(boss.alive).toBe(true);
  });

  test("tick applies gravity", () => {
    const boss = chefRivalBehavior.create(-500);
    const player = createPlayer(100, -400);
    const result = chefRivalBehavior.tick(boss, player, [], 0);
    expect(result.boss.vy).toBeGreaterThan(0);
  });

  test("tick generates no projectile attacks", () => {
    const boss = chefRivalBehavior.create(-500);
    const player = createPlayer(100, -400);
    const result = chefRivalBehavior.tick(boss, player, [], 0);
    expect(result.attacks).toHaveLength(0);
  });

  test("checkPlayerContact detects overlap", () => {
    let boss = chefRivalBehavior.create(-500);
    boss = { ...boss, x: 100, y: 200 };
    const player = { ...createPlayer(110, 210), width: 32, height: 40 };
    expect(chefRivalBehavior.checkPlayerContact(boss, player)).toBe(true);
  });
});

describe("KrakenBoss behavior", () => {
  test("create returns valid state", () => {
    const boss = krakenBehavior.create(-500);
    expect(boss.type).toBe("kraken");
    expect(boss.health).toBe(8);
  });

  test("tick generates tentacle attacks", () => {
    let boss = krakenBehavior.create(-500);
    const player = createPlayer(200, -400);
    const platforms = [makePlatform({ width: 100 })];
    let attacks = 0;
    for (let i = 0; i < 200; i++) {
      const result = krakenBehavior.tick(boss, player, platforms, i);
      boss = result.boss;
      attacks += result.attacks.filter((a) => a.type === "tentacle").length;
    }
    expect(attacks).toBeGreaterThan(0);
  });

  test("checkPlayerContact always false", () => {
    const boss = krakenBehavior.create(-500);
    const player = { ...createPlayer(boss.x, boss.y), width: 32, height: 40 };
    expect(krakenBehavior.checkPlayerContact(boss, player)).toBe(false);
  });

  test("applyTentacleAttack shrinks platform", () => {
    const plat = makePlatform({ width: 100 });
    const result = applyTentacleAttack(plat);
    expect(result.width).toBeLessThan(100);
  });
});

describe("UFOBoss behavior", () => {
  test("create returns valid state", () => {
    const boss = ufoBehavior.create(-500);
    expect(boss.type).toBe("ufo");
    expect(boss.health).toBe(10);
  });

  test("tick generates projectile attacks", () => {
    let boss = ufoBehavior.create(-500);
    const player = createPlayer(200, -400);
    let attacks = 0;
    for (let i = 0; i < 200; i++) {
      const result = ufoBehavior.tick(boss, player, [], i);
      boss = result.boss;
      attacks += result.attacks.filter((a) => a.type === "projectile").length;
    }
    expect(attacks).toBeGreaterThan(0);
  });

  test("checkPlayerContact always false", () => {
    const boss = ufoBehavior.create(-500);
    const player = createPlayer(boss.x, boss.y);
    expect(ufoBehavior.checkPlayerContact(boss, player)).toBe(false);
  });
});
