# Game architecture

Structuring game code for maintainability.

## Create the directory structure first

Set up the folder hierarchy before writing game logic. This is the single most impactful
decision for long-term maintainability. Even if most folders start with one small file,
the structure guides where new code goes — without it, everything lands in `main.ts`.

```
src/
  main.ts             # Thin bootstrap (~20 LOC) — init app, delegate to scene
  scenes/
    GameScene.ts      # Main game loop — wires entities + systems + rendering
  entities/
    Player.ts         # Player state and logic (NO rendering imports)
  systems/
    Physics.ts        # Collision detection, movement
  config/
    constants.ts      # Game constants (speed, sizes, tuning)
  rendering/
    sprites.ts        # PixiJS/Phaser sprite creation (rendering ONLY)
```

As the game grows, add folders and files — don't grow existing ones:

```
  scenes/
    MainMenu.ts       # Title screen, settings
    GameOver.ts       # Score display, retry
  entities/
    Enemy.ts          # Enemy behavior
    Projectile.ts     # Bullets, arrows, etc.
  systems/
    Scoring.ts        # Score tracking, combos
    Audio.ts          # Sound effect management
    Input.ts          # Keyboard, touch, tilt
  ui/
    HUD.ts            # In-game overlay
  services/
    Analytics.ts      # External integrations
  config/
    assets.ts         # Asset keys and paths
```

## Entry point discipline

`main.ts` should be a thin bootstrap — **under 30 LOC**. It creates the app, hands off to a
scene or launcher, and nothing else. If your main file is growing past 50 LOC, you're wiring
features in the wrong place.

```typescript
// GOOD — main.ts delegates immediately
import { Application } from "pixi.js";
import { GameScene } from "./scenes/GameScene";

async function main() {
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.getElementById("game")!.appendChild(app.canvas);
  new GameScene(app).start();
}
main();
```

If you need a title screen, game-over screen, settings, etc. — create a launcher or scene
manager, not a bigger main.ts.

## Scene-based organization

Every distinct game screen is its own scene:

## Separate logic from rendering

Game logic (state, rules, physics) should be testable without a canvas:

```typescript
// GOOD — pure logic, testable
class Player {
  health = 100
  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    return this.health <= 0  // returns true if dead
  }
}

// Rendering is separate
class PlayerSprite {
  constructor(scene: Phaser.Scene, private player: Player) {
    // Create sprite, animations, etc.
  }
  update() {
    // Sync sprite position/state with player logic
  }
}
```

## Entity-Component-System (ECS)

For complex games, consider ECS:
- **Entity** — a unique ID (the "thing")
- **Component** — data attached to an entity (Position, Health, Renderable)
- **System** — logic that operates on entities with specific components

ECS scales better than deep inheritance hierarchies. Libraries: bitECS, miniplex.

## State management

- Keep game state in a central store or on entities — not scattered in UI code
- Save/load game state by serializing the state object
- Use events/signals for communication between systems, not direct references

## Debug mode

Add a global `DEBUG_MODE` flag in your constants file. When enabled, it should make the
game easier to test manually — faster spawns, higher drop rates, skippable timers,
visible hitboxes, on-screen FPS/state overlays. This saves enormous time during
development because you don't have to play through the full game to reach the state
you're testing.

```typescript
export const DEBUG_MODE = false // flip to true during dev, never commit as true
export const SPAWN_CHANCE = DEBUG_MODE ? 0.5 : 0.08
export const INVINCIBLE = DEBUG_MODE // skip damage during testing
```

Keep `DEBUG_MODE` at the very top of the constants file — other constants that branch
on it must be declared after it.

## Anti-exploit design for scoring

Any idle or repetitive action that awards points will be exploited. Design countermeasures:
- Stagnation timer — penalize staying in one area (crumble platforms, disable bonuses)
- Diminishing returns — repeated actions in the same zone yield less
- Height/progress gates — only award meaningful score for forward progress

## Canvas UI hit detection

DOM event listeners and framework `stopPropagation` don't reliably prevent canvas clicks
from reaching game logic. Use coordinate-based hit detection instead:
- Check if click coordinates fall within UI element bounds
- Process UI hits first, skip game input if a UI element was hit
- For toggle text (e.g. "SFX: ON"), use separate text objects for label and value
  so only the value portion changes style

## Particle and effect systems

Without hard limits, particle systems accumulate and tank FPS. Always enforce:
- Maximum particle count (pool with fixed size)
- Maximum effect duration (force-kill after timeout)
- Immediate cleanup on particle death (return to pool, don't just hide)

## Audio: Web Audio API is sufficient

For casual game SFX, the Web Audio API with procedural oscillator-based sounds is
lightweight and zero-dependency. No need for Howler.js or @pixi/sound. Pattern:
- Lazy `AudioContext` creation on first user gesture
- Oscillator + gain envelope per sound effect
- Keep a small library of generator functions (jump, collect, hit, explosion)

## Screen orientation

Mobile games usually need a locked orientation. A reliable approach uses three layers:
1. **Viewport meta tag** — `interactive-widget=resizes-content` for proper mobile layout
2. **Web App Manifest** — `"orientation": "portrait"` (or `"landscape"`) in `manifest.json`
3. **CSS fallback** — show a "please rotate" overlay via `@media (orientation: landscape)`
   for browsers that ignore the manifest

For tilt/motion controls, prefer `DeviceMotionEvent` (accelerometer) over
`DeviceOrientationEvent` (gyroscope) — accelerometer gives direct gravity vectors
which are simpler to map to movement. iOS requires an explicit permission request
via `DeviceMotionEvent.requestPermission()`.

## Countdown and transitions

Starting a game with a black screen + countdown, then suddenly showing everything
feels jarring. Instead: render the full scene (frozen) during countdown. Call `render()`
during countdown ticks but skip `update()` logic. The player sees the world they're
about to play in.

## Testing rendering code

"Rendering is tested manually" is not a strategy — it's how 30+ files end up with zero tests.
You can't test pixels in Node, but you can test the rendering *layer*:

- **Smoke tests** — mock the engine, call the render function, verify it doesn't throw
- **Contract tests** — verify render functions receive the right state shape
- **Configuration tests** — particle configs, animation timings, sprite definitions are pure
  data — test that they have required fields and valid ranges
- **State sync tests** — verify that the scene's update loop produces the right calls
  (e.g., sprite position matches entity position after update)

The goal isn't pixel-perfect validation — it's catching regressions when someone refactors
entity state or renames a config key. A thin mock of the engine is enough.
