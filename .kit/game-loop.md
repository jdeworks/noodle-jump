# Game loop

Understanding and implementing the update/render cycle.

## The core loop

Every game runs a loop:

1. **Process input** — read keyboard, mouse, touch, gamepad
2. **Update state** — move entities, check collisions, apply rules
3. **Render** — draw the current state to the screen
4. Repeat at 60 FPS (or your target frame rate)

## Delta time

Never assume a fixed frame rate. Use delta time (time since last frame):

```typescript
// WRONG — frame-rate dependent
player.x += 5; // moves faster at 120 FPS, slower at 30 FPS

// RIGHT — frame-rate independent
player.x += speed * deltaTime; // consistent speed at any FPS
```

Most frameworks pass delta time to your update function:

- Phaser: `update(time, delta)` — delta is in milliseconds
- PixiJS: `app.ticker.add((ticker) => { ticker.deltaMS })`
- Three.js: `clock.getDelta()` — returns seconds

## Fixed vs variable timestep

- **Variable timestep** (default): update runs once per frame with actual delta.
  Simple but can cause physics instability at low FPS.
- **Fixed timestep**: physics updates at a fixed rate (e.g., 60 Hz) regardless of frame rate.
  More stable for physics-heavy games.

```typescript
const FIXED_STEP = 1000 / 60; // 60 Hz
let accumulator = 0;

function update(delta: number) {
  accumulator += delta;
  while (accumulator >= FIXED_STEP) {
    physicsUpdate(FIXED_STEP); // always called with the same dt
    accumulator -= FIXED_STEP;
  }
  render(); // render at actual frame rate
}
```

## Performance

- Target: 60 FPS = ~16.7ms per frame
- Profile with browser DevTools (Performance tab)
- Common bottlenecks: too many draw calls, complex collision checks, garbage collection
- Don't optimize until you measure — premature optimization wastes time
