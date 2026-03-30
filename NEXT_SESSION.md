# Noodle Jump — Next Session Prompt

Copy-paste this into your next Claude Code session:

---

## Context

We're building Noodle Jump — a browser-based endless jumper (Doodle Jump clone) with a pasta theme. The full project plan is at `think-tank-output/noodle-jump-2026-03-29T07-54-20/plan.md` in the think-tank repo.

The core game is built and working. Read `CLAUDE.md` → `AGENTS.md` for project conventions, then check the memory files for context.

## Setup

Start the dev server + Cloudflare tunnel for mobile testing:

```bash
npm install
npx vite --host 0.0.0.0 --port 5173 &
# Wait for Vite to be ready, then:
/tmp/cloudflared tunnel --url http://localhost:5173
```

If cloudflared isn't installed: `curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared && chmod +x /tmp/cloudflared`

Important: If Vite restarts, the tunnel returns 502 — kill both and restart in order.

## Current state

- 68 tests passing (`npx vitest run`)
- Types clean (`npx tsc --noEmit`)
- `DEBUG_MODE = true` in `src/config/constants.ts` — zones are short (10/25 platforms). Set to `false` for production (80/280).
- Debug HUD visible (sensor readout + direction bar) — hidden when `DEBUG_MODE = false`

## What to do next (priority order)

### 1. Parallax redesign

The floating shape layers (mid/front) don't add much and slow things down. Replace with:

- Keep the 5 big feature animations (plate/pot/solar system) on the back layer — they work well
- Instead of floating shapes, add more platform-like decorative elements — faded, non-interactive platforms in the background at different parallax speeds
- Longer fade transition between zones (~3 seconds, currently ~1.5s)
- Fix: features shouldn't spawn at same positions as previous zone's features

### 2. Negative power-ups

Add 3-4 negative power-ups that the player should AVOID. Must be visually VERY distinct from positive ones (different shape — triangle/skull, red glow, pulsing warning):

- **Chili Pepper** — inverts controls for ~5 seconds. Red/angry visual, screen tint red.
- **Soggy Noodle** — all upcoming platforms become brittle for ~5 seconds. Limp noodle visual, screen goes slightly blue/wet.
- **Garlic Breath** — screen gets foggy/hazy, visibility reduced for ~5 seconds. Green cloud particles.
- **Burnt Toast** — platforms shrink in width for ~5 seconds. Dark/charred visual.

Each needs: distinct warning shape (NOT diamond), particle effects, screen feedback so the player knows something bad happened.

### 3. Power-up visual distinction

- Positive power-ups: keep diamond shape, each with unique icon
- Negative power-ups: use triangle/warning shape with red/dark glow + pulsing animation
- Each power-up (positive and negative) needs its own unique animation when active (like rocket has the rocket sprite, tornado has spin + dust)

### 4. Title screen

- Scrolling pasta-world background (reuse zone 1 parallax)
- Game logo / title text
- High score display
- "Tap to play" prompt
- Tilt permission request integrated into start flow

### 5. Background music

- Find a CC0 track from opengameart.org or freesound.org
- Howler.js or @pixi/sound for playback
- Mute toggle
- Handle mobile autoplay restrictions

### 6. Ship prep

- Set `DEBUG_MODE = false`
- Remove debug HUD completely
- Build to `docs/` folder: update vite.config.ts `build.outDir` to `'docs'`
- Test on real Android + iOS devices
- Deploy to GitHub Pages (serve from `docs/` on `dev` branch)

## Key architecture decisions

- Pure logic separated from rendering (entities/ and systems/ have NO PixiJS imports)
- Tests cover logic only — rendering tested manually
- Accelerometer (`-accel.x`) used for tilt, not gyroscope gamma (unreliable)
- Zone progression counts platforms PASSED (cumulative counter), not generated
- Power-ups: only one uncollected on screen at a time, cooldown of 5 platforms between spawns, skip first 10 platforms
- Platform possibility check: never two consecutive unlandable platforms, tighter gap after brittle

## Files to read first

- `src/config/constants.ts` — all tunable values
- `src/scenes/GameScene.ts` — main game wiring
- `src/main.ts` — PixiJS app init, HUD, game over screen
- `src/systems/Parallax.ts` — background system (needs redesign)
- `src/entities/PowerUp.ts` — power-up logic (add negative types here)

## Further notes

(Completed items removed — keyboard input fixed, spaghetti visual fixed, hooks/cleanup done in separate session)
