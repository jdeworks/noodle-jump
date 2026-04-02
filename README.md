# Noodle Jump

A pasta-themed endless jumper built with PixiJS and TypeScript.

**[Play now](https://jdeworks.github.io/noodle-jump/)**

## Features

### Gameplay
- **14 power-ups** — 10 positive (spring, tornado, rocket, lasagna layers, sneeze, magnet, pasta shield, penne cannon, gnocchi bounce, minestrone soup) and 4 negative (chili pepper, soggy noodle, garlic breath, burnt toast)
- **11 platform types** — static, breaking, brittle, moving, conveyor, spring, ice, crumbling, teleport, weighted, lasagna
- **3 boss types** — Chef Rival (jumps on platforms), Kraken (steals platform chunks), UFO (shoots projectiles)
- **Enemies** (opt-in) — rats, fish, aliens per zone. Throw knives to defeat them (3 ammo, regenerating)
- **7 themed zones** — Kitchen, Ocean, Space, Freezer, Volcano, Candy World, Final Kitchen
- Combo system, close-call bonuses, landing streaks
- Wind gusts, day/night cycle, weather effects per zone
- Progressive difficulty scaling with zone-specific mechanics

### Multiplayer
- **Local co-op** — split-screen on one PC (P1: WASD, P2: Arrow keys)
  - Best Height — both play until dead, ghost mode after first death, highest height wins
  - First to Die — first player to die loses, fast rounds
  - Timed (2 min) — both play for 2 minutes with respawn and -10% height penalty on death
- **Online multiplayer** — peer-to-peer via WebRTC
  - Quick Connect — uses public Nostr relays for signaling
  - Private Connect — manual SDP exchange, no external servers
  - Lobby with ready-up, interpolated remote player rendering

### Audio
- Unique music track per zone with smooth crossfade transitions
- Boss battle music
- Per-power-up SFX (14 unique sounds)
- Per-platform landing SFX
- Procedural ambient audio per zone (Web Audio API)
- Volume sliders for SFX and music

### UI & Meta
- Tutorial overlay for first play
- How to Play encyclopedia with all mechanics explained
- Power-up encyclopedia tracking collected types
- Custom runs — configurable seed, enemies, power-ups, difficulty, starting zone, practice mode
- 22 achievements with persistent cross-session stats
- 18 unlockable cosmetics (outfits, trails, platform skins)
- Local leaderboard with tamper detection
- Share score via clipboard/Web Share API
- Debug mode with presets for testing specific features

### Technical
- Tilt controls on mobile, keyboard (arrow keys / WASD) on desktop
- Virtual joystick as tilt fallback
- PWA — installable, works offline via service worker
- Haptic feedback on mobile (impacts, power-ups, death)
- Seeded RNG for deterministic/reproducible runs
- 383 tests across 48 test files
- Modular architecture — pure logic separated from PixiJS rendering

## Development

```bash
npm install
npx vite --host 0.0.0.0
```

### Build

```bash
npx vite build   # outputs to docs/ for GitHub Pages
```

### Tests & Quality

```bash
npx vitest run    # 343 tests
npx tsc --noEmit  # type check
npx eslint src    # lint
make health       # LOC budget + file size checks
```

### Pre-commit Hooks

Commits are gated by: LOC limit (400/file), typecheck, lint, and test suite.

## Credits

See [CREDITS.md](./CREDITS.md) for full music attribution.

### Music

All Pixabay tracks used under the [Pixabay Content License](https://pixabay.com/service/license-summary/). Boss battle music by nene (CC0) from [OpenGameArt](https://opengameart.org/content/boss-battle-5-8-bit).

### Built with

- [PixiJS](https://pixijs.com/) — 2D WebGL renderer
- [Vite](https://vitejs.dev/) — Build tool
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) — Test runner
