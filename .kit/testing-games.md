# Testing games

Testing game logic without needing a canvas.

## What to test

- **Game logic** — scoring, health, inventory, level progression, win/lose conditions
- **State transitions** — menu → gameplay → game-over
- **Data processing** — level parsing, save/load serialization
- **Utility functions** — collision math, random generation, coordinate conversion

## What NOT to test

- **Rendering** — visual output (test manually or with screenshot comparison)
- **Input handling** — platform-specific (test via integration/manual)
- **Audio playback** — test that the right sound is triggered, not that it plays
- **Engine internals** — trust the framework

## Example tests

```typescript
import { Player } from "../src/entities/Player";
import { Scoring } from "../src/systems/Scoring";

describe("Player", () => {
  test("takes damage correctly", () => {
    const player = new Player();
    player.takeDamage(30);
    expect(player.health).toBe(70);
  });

  test("cannot go below 0 health", () => {
    const player = new Player();
    player.takeDamage(999);
    expect(player.health).toBe(0);
  });

  test("reports death when health reaches 0", () => {
    const player = new Player();
    const isDead = player.takeDamage(100);
    expect(isDead).toBe(true);
  });
});

describe("Scoring", () => {
  test("awards combo bonus", () => {
    const scoring = new Scoring();
    scoring.addKill();
    scoring.addKill(); // within combo window
    expect(scoring.score).toBeGreaterThan(200); // base 100 * 2 + combo
  });
});
```

## Separation pattern

The key to testable games is separating logic from the engine:

```typescript
// Testable (no engine dependency)
export function calculateDamage(base: number, armor: number): number {
  return Math.max(1, base - armor);
}

// Engine-dependent (not unit-tested)
scene.events.on("hit", (target, projectile) => {
  const damage = calculateDamage(projectile.power, target.armor);
  target.entity.takeDamage(damage);
});
```

Test `calculateDamage` directly. The event wiring is tested via play testing.
