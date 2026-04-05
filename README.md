# Noodle Jump

A pasta-themed endless jumper built with PixiJS and TypeScript.

**[Play now](https://jdeworks.github.io/noodle-jump/)**

## Features

### Gameplay

- **13 playable characters** — 10 base (Chef, Goblin, Grandma, Robot, Ninja, Princess, Alien, Viking, Pirate, Wizard) + 3 unlockable (Neon Chef, Nyan Cat, Skeleton) — each with a unique projectile
- **13 power-ups** — 8 positive (spring, tornado, rocket, lasagna layers, sneeze, magnet, pasta shield, gnocchi bounce) and 5 negative (chili pepper, soggy noodle, garlic breath, burnt toast, minestrone soup)
- **11 platform types** — static, breaking, brittle, moving, conveyor, spring, ice, crumbling, teleport, weighted, lasagna
- **3 boss fights** — Chef Rival (jumps between platforms), Kraken (tentacles steal platform chunks), UFO (aimed projectile spreads)
- **Enemies** (opt-in) — rats, fish, aliens per zone. Throw projectiles to defeat them (3 ammo, regenerating)
- **7 themed zones** — Kitchen, Boiling Pot, Space, Freezer, Volcano, Candy World, Final Kitchen
- Combo system, close-call bonuses, landing streaks
- Wind zones, day/night cycle, weather effects per zone
- Progressive difficulty scaling with zone-specific mechanics

### Multiplayer

- **Local co-op** — split-screen on one device (P1: WASD, P2: Arrow keys)
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
- Per-power-up SFX (13 unique sounds)
- Per-platform landing SFX
- Procedural ambient audio per zone (Web Audio API)
- Volume sliders for SFX and music

### UI & Meta

- Tutorial overlay for first play
- How to Play screen with all mechanics explained
- Custom runs — configurable seed, enemies, power-ups, difficulty, practice mode
- **35 achievements** with persistent cross-session stats
- **21 unlockable cosmetics** — 8 trails (rainbow/fire/sparkle/neon/stars/hearts/snow), 8 tints, 5 themes (neon/pixel/candy/dark)
- **4 visual themes** — Neon (glowing outlines + bloom), Pixel (retro 8-bit), Candy (pastel), Dark (shadowy) — reskin all game elements + menus
- **Customize screen** with character/trail/tint/theme selection, achievements, unlock codes, progress export/import
- Local leaderboard with tamper detection
- Share score via clipboard/Web Share API
- Debug mode with presets for testing specific features

### Technical

- Tilt controls on mobile, keyboard (arrow keys / WASD) on desktop
- Touch controls (tap left/right half) as tilt alternative
- PWA — installable, works offline via service worker
- Haptic feedback on mobile (impacts, power-ups, death)
- Seeded RNG for deterministic/reproducible runs
- 420 tests across 57 test files
- Frame-rate independent — delta-time game loop ensures consistent speed at any refresh rate (60Hz, 144Hz, etc.)
- Modular architecture — pure logic separated from PixiJS rendering

## Development

```bash
npm install
npm run dev
```

### Build

```bash
npx vite build   # outputs to docs/ for GitHub Pages
```

### Tests & Quality

```bash
npx vitest run    # 406 tests
npx tsc --noEmit  # type check
npx eslint src    # lint
make health       # LOC budget + file size checks
```

### Pre-commit Hooks

Commits are gated by: LOC limit (400/file), typecheck, lint, and test suite.

---

## Lessons Learned — Building a Game with AI

This project was built across 12+ Claude Code sessions (~160 commits). Below are the hardest problems encountered, reconstructed from the actual conversation logs. These aren't just the final fixes — they include the wrong turns, failed attempts, and user corrections that led to the solutions.

### 1. Mobile tilt controls — debugging the wrong sensor (~15 iterations)

**Problem:** Tilt input on mobile was unreliable. The player flew to one side and couldn't be corrected.

**What was tried:** Calibrated from first tilt event (noisy), averaged 10 samples (still drifted), added dead zones and low-pass smoothing (marginal), compensated for beta > 90° where gamma flips sign (made it worse).

**Breakthrough:** The user asked for raw sensor debug output on screen. This revealed `DeviceOrientationEvent.gamma` was unreliable on their device, but `DeviceMotionEvent.accelerationIncludingGravity.x` worked perfectly. ~10 rounds of debugging were spent on the wrong sensor.

**Then on iOS:** The sign convention was inverted on some devices. No reliable way to detect which convention without sampling. Fix: auto-detect by checking which direction early readings trend.

**Takeaway:** When sensor data behaves unexpectedly, expose raw values to the user first instead of adding compensating math on top of bad data. And test on multiple physical devices — simulators don't reproduce sensor quirks.

### 2. Squash-and-stretch animation fighting physics (~10 exchanges)

**Problem:** Landing on platforms felt flat. Adding squash animation was "invisible" at 8 ticks, then wrong at 16 — the jump fired instantly on collision, so squash played while the player was already moving upward.

**What was tried:** Longer durations, different easing curves, scaling the sprite. All looked wrong because the physics and animation were in conflict.

**Fix:** Complete rewrite of the collision-to-jump flow. Phased animation: hold the player on the platform during squash (6 frames), _then_ fire the jump during stretch (8 frames) with eased keyframe curves. Required separating the "landed" event from the "jump" event.

**Side effect:** The squash hold froze ALL physics including horizontal movement, so the player couldn't slide into meatballs during the hold. Fix: only freeze vertical position, keep horizontal movement and collection active.

**Takeaway:** In a game, animation and physics must be designed together. You can't layer animation on top of existing physics without rethinking the state machine.

### 3. Invisible projectiles — the sync system's blind spot (4 attempts across sessions)

**Problem:** Player knives were invisible throughout boss fights, making them unwinnable.

**Attempt 1:** Assumed double-firing from touchstart + click. Added debounce. Still invisible.
**Attempt 2:** Checked rotation, positioning, z-order. Still invisible.
**Attempt 3:** Found the real cause — the `GraphicsSync` system only tracked platform/meatball/powerup counts to trigger re-rendering. Projectiles were never checked, so their Graphics objects were never created. Fixed sync.
**Attempt 4:** User reports STILL invisible. `prevProjectileCount` was read from `gfxMap.size` before the tick, but projectiles were added via DOM events between frames — timing mismatch.

**Takeaway:** When you add a new entity type to a game, audit every system that enumerates entities. Rendering, sync, cleanup, collision — each one needs explicit support. "It should just work" doesn't apply.

### 4. Zone progression never triggered — counting pruned platforms

**Problem:** Zones never switched. User climbed 2000 height with no zone change.

**Root cause:** `platformsPassed` was calculated as `platforms.filter(p => p.y > player.y).length` — counting platforms _currently in memory_ below the player. But platforms get **pruned** as the player climbs, so the count dropped instead of growing.

**Fix:** Changed to a cumulative counter that increments whenever the player passes a new highest point. But this introduced new issues across later sessions — the counter included broken platforms, kept counting during boss transitions, and accumulated stale height gaps after boss fights. Each required its own fix.

**Takeaway:** Derived state (counting from arrays) is fragile when the underlying collection is mutated. Prefer explicit accumulators for progress tracking.

### 5. The Lasagna power-up — 4 complete rewrites

**Iteration 1:** Spawn platforms below the player. Platforms appeared under the player but they'd already fallen past them.
**Iteration 2:** Spawn platforms above the player. Conceptually wrong — you need safety below when falling, not above.
**Iteration 3:** Spawn near player at proper grid intervals. Platforms overlapped existing ones, wrong Y positions.
**Iteration 4:** Abandoned platform spawning entirely. Lasagna now reduces gravity (slow float) so the player can reach existing platforms.

**User feedback that forced the rethink:** "What does this even do?" after iteration 3. The AI kept trying to make the original concept work instead of asking what the player actually needs.

**Takeaway:** When a mechanic takes 3+ attempts, the concept might be wrong, not the implementation. Step back and ask what the player experience should _feel_ like.

### 6. Catastrophic staged-changes data loss

**Problem:** After a session, the dev server showed an old version with none of the previous session's features.

**Investigation:** 43 files were **staged for deletion** in git — an incomplete refactor from a prior session that was never committed. The committed HEAD had all the correct code, but the dirty staging area was overriding the dev server.

**Fix:** `git checkout -- .` to reset staging, then carefully reapply only the targeted fixes.

**Takeaway:** `git diff --cached` should be the first check at session start. Staged changes persist silently across sessions and can shadow committed code. This led to adding "check stale staged changes" as a mandatory session-start step.

### 7. Two event systems, one canvas — the phantom game start

**Problem:** Tapping "How to Play" simultaneously started the game. In multiplayer, a phantom single-player game spawned in the background.

**Root cause:** PixiJS `stopPropagation()` only stops PixiJS event bubbling, NOT the underlying DOM event. The canvas had a DOM-level `click` listener for `startGame` that caught every click regardless of what PixiJS button was pressed. In multiplayer, the title screen's `handleKey` listener was never removed, so pressing Enter in the mode picker triggered `launchGame()`.

**Fix:** Removed canvas-wide click/touchstart listeners. Only explicit PixiJS buttons start the game. For multiplayer, clean up ALL event listeners when leaving the title screen.

**Takeaway:** When using a canvas rendering library on top of DOM, you have two parallel event systems. Events that look "handled" in one system still propagate in the other.

### 8. Meatball magnet nullified every frame

**Problem:** The meatball magnet power-up didn't visibly attract meatballs despite correct attraction code.

**Root cause:** `updateMeatballPositions()` snapped meatballs back to their platform positions every frame. It ran _after_ `attractMeatballs()`, overwriting the pull. The magnet moved them, then the position sync moved them back.

**Fix:** Skip platform position sync when magnet is active.

**Takeaway:** When two systems write to the same state, execution order matters. Check for write conflicts when adding new mechanics that move existing entities.

### 9. Service worker caching defeating dev testing

**Problem:** Changes weren't visible on phone despite correct code. Bumping the SW cache version, adding self-unregister logic, even cache-clearing code — nothing worked because the old service worker was still in control.

**What finally worked:** Kill the tunnel and create a new one on a fresh domain with no cached SW. Then added a dev-mode check to skip SW registration entirely on localhost/tunnel URLs.

**Takeaway:** Service workers are a one-way deployment. Once installed, they control the page until explicitly replaced. For dev testing, either skip SW registration or use a fresh origin.

### 10. Boss fight arena escape via power-ups

**Problem:** A rocket power-up catapulted the player above the boss arena, escaping the fight and entering the next zone.

**First fix:** Break platforms above the camera during boss fights. This caused instant death because it destroyed the platform the player was standing on.

**Refined fix:** Only break platforms well outside the arena (50px inset), convert all arena power-ups to safe types (shield, bounce, magnet) when the boss spawns, and cancel active movement effects. Each layer of the fix was discovered through playtesting.

**Takeaway:** Boss arenas need defense in depth — not just camera locking but also power-up filtering, platform protection, and velocity capping. Each escape vector is a separate hole to plug.

### 11. WebRTC multiplayer — invisible failures

**Remote player invisible:** Position data was silently dropped because `data instanceof ArrayBuffer` failed when the WebRTC library delivered `Uint8Array`. Additionally, the OnlineSession created a NEW `GameSync` instead of reusing the lobby's connected one, causing `makeAction()` to return non-functional callbacks. Both bugs had to be fixed together.

**Seed desync in local co-op:** Both game scenes drew from the same global RNG, producing different platform layouts. Fix: each player gets a separate RNG closure swapped before each tick.

**GDPR concern shaped architecture:** The user raised DSGVO concerns about IP addresses visible to Nostr relay servers. This redirected from a single signaling strategy to dual: Quick Connect (Nostr, convenient but IPs visible) + Private Connect (manual SDP codes, zero external servers). The user chose "fail gracefully without TURN" over adding relay infrastructure.

**Takeaway:** P2P multiplayer has three invisible failure modes: data format mismatches (ArrayBuffer vs Uint8Array), connection object identity (which instance are callbacks attached to?), and shared global state (RNG, config singletons).

### 12. PixiJS has no layout engine — death by pixel nudging

**Recurring pattern:** Text and button overlaps were reported at least 8 times across sessions. Each time, pixel offsets were manually adjusted (move settings 5px down, move high score 10px left). An auto-layout system was proposed but kept getting deferred in favor of quick fixes.

**Also:** PixiJS renders to canvas, so there's no native text input. The multiplayer room code field wasn't interactive on mobile — keyboard didn't open. Fix: overlay real HTML `<input>` elements on top of the canvas, positioned to match the PixiJS coordinates.

**Takeaway:** If your canvas UI has more than ~5 interactive elements, invest in a layout system early. Manual absolute positioning creates a maintenance burden that compounds with every screen.

### 13. PixiJS Graphics.clear() leaks GPU buffers when called every frame

**Problem:** FPS dropped progressively from 60 to 27 over 30 seconds of gameplay. Entity counts stayed flat — the issue wasn't too many objects.

**Root cause:** When we replaced `drawChef()` with `drawCharacter()` for power-up effects, we accidentally removed the `gfx.clear()` call. `drawChef()` had `gfx.clear()` at the top. `drawCharacter()` delegated to character-specific functions that DON'T clear. Result: 10+ PixiJS shapes were added to the player's Graphics object every frame, accumulating to 30,000+ shapes after 30 seconds.

**How we found it:** Added FPS + entity count logging every second. Counts were stable but FPS dropped steadily — pointed to a per-object leak, not an object count issue. Checking which Graphics objects called `clear()` vs which didn't revealed the missing call.

**Fix:** Added `gfx.clear()` to `drawCharacter()` before delegating to the character draw function.

**Additional discovery:** Even legitimate `gfx.clear()` + redraw cycles leak in PixiJS v8 if done every frame. Platform rendering was calling `drawThemedPlatform()` (which clears and rebuilds) for every platform every frame. Caching by color key and only redrawing on zone change eliminated 40 geometry rebuilds per frame.

**Takeaway:** In PixiJS v8, `Graphics.clear()` doesn't fully release internal GPU buffers. Calling it 60 times per second per object causes progressive slowdown. Cache drawn graphics and only rebuild when the visual actually changes. When delegating draw functions, verify that `clear()` is called exactly once before drawing.

### 14. Cosmetic themes — theming every screen requires rebuild-on-close

**Problem:** After selecting a theme in the Customize screen, the title screen and other screens still showed the old theme colors.

**Root cause:** The title screen is created once at startup. All buttons, text styles, and colors are set during construction using `getUITheme()`. When the user changes theme in Customize, the already-constructed title screen still has the old colors.

**Fix:** When the Customize screen closes, destroy and recreate the entire title screen: `titleContainer.destroy({ children: true }); showTitleScreen(app, onStartGame);`. This ensures all buttons and text pick up the new theme. Other screens that re-render on `show()` (ExplanationScreen, CustomRunScreen, CustomizeScreen) naturally get the new theme each time they open.

**Takeaway:** Singleton UI screens that are constructed once need a rebuild mechanism when global state changes. The pattern: store a `titleDestroyed` flag, set it before destruction, check it in the ticker to prevent use-after-free crashes.

### 15. Neon glow without BlurFilter — the multi-layer alpha approach

**Problem:** Wanted a "broken neon sign" glow effect. BlurFilter on the entire scene killed FPS (multiple Gaussian passes per frame on every pixel).

**What didn't work:** `BlurFilter({ strength: 1.5, quality: 3 })` on the scene container — dropped FPS from 60 to 15 on mobile. Even `strength: 0.5, quality: 1` was too expensive.

**What worked:** Multiple concentric filled shapes at decreasing alpha, drawn ONCE and cached. For a platform: 4 rounded rectangles extending 3-10px beyond the platform edge at alpha 0.04→0.08→0.15→0.25, plus a bright stroke outline and a white center highlight. Combined with a dark background (0x080818), the bright alpha layers create convincing light bleed. Add per-object alpha flickering (dual sine waves with unique phase) for the "broken sign" effect — this only modulates alpha, no geometry rebuild needed.

**Takeaway:** In 2D games without post-processing, fake glow via concentric alpha layers outperforms real blur filters by 10x+. The key: draw the glow layers once (cached), then animate only alpha for flickering. Dark backgrounds make even subtle alpha layers visible as "light bleeding."

### 16. Bezier curves in PixiJS Graphics are expensive — avoid in hot loops

**Problem:** The rainbow (Nyan Cat) trail used quadratic bezier curves to smoothly connect trail segments. With 90 points × 6 color bands = 534 bezier-filled shapes rebuilt on a single Graphics every frame, FPS dropped to 15.

**Root cause:** PixiJS tessellates bezier curves into triangles for GPU rendering. Each `quadraticCurveTo` + `fill` generates a triangle fan. 534 of these rebuilt 60 times per second overwhelmed the geometry pipeline.

**Fix:** Reduced point density (record every 2nd frame), reduced max points (80→40), and the bezier shapes are now reasonable at ~240 per frame. The real FPS fix was the player sprite leak (lesson 13), not the beziers — once that was fixed, 240 bezier shapes per frame ran fine.

**Takeaway:** PixiJS bezier tessellation is 3-5x more expensive than simple rect fills. For particle/trail effects with many shapes, profile before using curves. If you need curves, reduce point count aggressively.

---

## Credits

See [CREDITS.md](./CREDITS.md) for full music attribution.

### Music

All Pixabay tracks used under the [Pixabay Content License](https://pixabay.com/service/license-summary/). Boss battle music by nene (CC0) from [OpenGameArt](https://opengameart.org/content/boss-battle-5-8-bit).

### Built with

- [PixiJS](https://pixijs.com/) — 2D WebGL renderer
- [Vite](https://vitejs.dev/) — Build tool
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) — Test runner
- [Claude Code](https://claude.ai/claude-code) — AI-assisted development
