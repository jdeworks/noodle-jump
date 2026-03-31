# Noodle Jump — Improvement Backlog

Compiled 2026-03-30. Organized by priority within each category.

---

## Visuals & Effects

### Particle Systems (missing)
- [ ] Chili pepper: flame particles trailing behind the sprite
- [ ] Soggy noodle: water drip particles falling from sprite
- [ ] Garlic breath: green fog/cloud particle overlay on screen
- [ ] Burnt toast: smoke particle trail rising from sprite
- [ ] Meatball magnet: white/blue sparkle particles flowing toward the magnet
- [ ] Spaghetti spring: needs unique sprite (still uses normal chef with flash)

### Animation Polish
- [ ] Death animation — more expressive (splat, noodle ragdoll, dramatic fall)
- [ ] Platform break animation — more dramatic (debris, screen flash)
- [ ] Trail/afterimage effect for high-speed movement (rocket, tornado, sneeze)
- [ ] Meatball collect animation (pop, sparkle burst, score float)
- [ ] Power-up collect animation (brief freeze-frame, zoom effect)
- [ ] Combo visual feedback (screen border glow, multiplier size pulse)
- [ ] Zone transition cinematic (brief flash, background morph)

### Visual Fidelity
- [ ] Replace procedural sprites with pixel art assets
- [ ] Add sprite sheets for character animations (idle, jump, fall, land)
- [ ] Platform textures per zone (wood in kitchen, coral in ocean, crystal in space)
- [ ] Background weather effects (steam in kitchen, bubbles in ocean, stars in space)
- [ ] Screen tint that fades with power-up effects
- [ ] Meatball spin animation (currently static)

---

## Gameplay Mechanics

### New Power-ups
- [ ] Pasta Shield — absorbs one hit from a negative power-up
- [ ] Rigatoni Drill — smashes through platforms downward to collect meatballs below
- [ ] Penne Cannon — shoots upward creating temporary platforms
- [ ] Gnocchi Bounce — super bouncy, all platforms give 2x jump height
- [ ] Minestrone Soup — screen floods from bottom, forced upward urgency

### New Obstacles / Enemies
- [ ] Moving enemies (rats in kitchen, fish in ocean, aliens in space)
- [ ] Falling hazards (dropping knives, falling asteroids)
- [ ] Wind gusts that push the player sideways
- [ ] Lava/water rising from below (timed urgency sections)
- [ ] Boss encounters at zone transitions

### Platform Variety
- [ ] Conveyor platforms (push player left/right)
- [ ] Teleport platforms (warp to another location)
- [ ] Spring platforms (extra bounce height, visual coil)
- [ ] Ice platforms (slippery, player slides)
- [ ] Crumbling platforms with visible timer (cracks spread before breaking)
- [ ] Weighted platforms (tilt based on where player lands)

### Difficulty & Progression
- [ ] Zone 3 endgame: "boss" mechanic or survival mode indicator
- [ ] Moving platform speed scaling with the 800-platform ramp
- [ ] Adaptive difficulty based on player skill (death count, average height)
- [ ] Daily challenge mode with fixed seed
- [ ] Reward for reaching new zones (score bonus, cosmetic unlock)

---

## Zones & Themes

### New Zones (4+)
- [ ] Zone 4: Freezer — ice platforms, frost effects, slippery movement, snowfall parallax
- [ ] Zone 5: Volcano — lava rising, fire platforms, heat shimmer, eruption events
- [ ] Zone 6: Candy — bouncy gummy platforms, sugar crystal parallax, sweet power-ups
- [ ] Zone 7: Final Kitchen — golden chef's table, all mechanics combined, endless

### Parallax Enhancements
- [ ] More parallax layers per zone (currently 3 ghost layers + features)
- [ ] Interactive background elements (parallax objects player can bump into)
- [ ] Day/night cycle within zones
- [ ] Weather system (rain, snow, sandstorm) affecting gameplay
- [ ] Animated background characters (kitchen staff, sea creatures, astronauts)

### Zone Transition Polish
- [ ] Brief cinematic/cutscene between zones
- [ ] Zone-specific music tracks (currently only 2 tracks)
- [ ] Zone-specific SFX variations (different jump sounds per zone)
- [ ] Unique meatball variants per zone (meatball → fish ball → meteor ball)

---

## Audio

### SFX Improvements
- [ ] Unique SFX per power-up type (all positives currently share one sound)
- [ ] Audio cue when lasagna platforms are about to expire
- [ ] Wind/whoosh sound during flight effects (tornado, rocket, sneeze)
- [ ] Crumble warning sound before timed platforms break
- [ ] Ambient zone sounds (kitchen clatter, ocean waves, space hum)
- [ ] Landing sound variation based on platform type
- [ ] Combo escalation SFX (pitch rises with multiplier)

### Music
- [x] Boss battle music (8-bit, CC0 by nene from OpenGameArt)
- [x] Volume normalization across all tracks (-16 LUFS target)
- [x] Volume sliders (SFX + Music, 0-100%)
- [ ] Dedicated music per zone (7 unique tracks — currently reusing 2)
- [ ] Compose original soundtrack (currently using placeholder tracks)
- [ ] Per-zone music themes with smooth crossfade (system exists, needs tracks)
- [ ] Dynamic music layers that intensify with difficulty
- [ ] Victory jingle for zone completion
- [ ] Menu/title screen music

---

## UX & UI

### HUD Improvements
- [ ] Power-up indicator showing what the current effect does (not just the name)
- [ ] Mini-map showing upcoming platforms
- [ ] Combo counter with visual flair (flames, lightning)
- [ ] Zone progress indicator showing distance to next zone
- [ ] Health/lives system (optional mode)

### Title Screen
- [ ] Animated chef character on title screen
- [ ] Mode selection (Classic, Daily Challenge, Endless)
- [ ] Stats overview (total games, total meatballs, best height)
- [ ] Cosmetic shop / character selection
- [ ] Credits / about screen

### Game Over Screen
- [ ] Replay of final moments (death cam)
- [ ] Comparison to previous best
- [ ] Achievement unlocks display
- [ ] "One more try" quick restart without full reload

### Onboarding
- [ ] Tutorial overlay for first play (tilt to move, jump on platforms)
- [ ] Power-up encyclopedia (collected power-ups logged with descriptions)
- [ ] Visual indicator when first encountering a new platform type
- [ ] Practice mode with no death

---

## Social & Meta

### Leaderboards
- [ ] Online leaderboard (Cloudflare Workers / KV store)
- [ ] Daily/weekly/all-time rankings
- [ ] Friend leaderboard via share codes
- [ ] Ghost replay of top scores

### Sharing
- [ ] Share URL with embedded score (Open Graph meta tags)
- [ ] Screenshot capture of game over screen
- [ ] Share to social media (Twitter/X card, etc.)
- [ ] QR code for quick mobile access

### Achievements
- [ ] Achievement system (first 100 meatballs, reach zone 3, 10x combo, etc.)
- [ ] Badge display on game over screen
- [ ] Progressive unlocks (new chef hats, outfits)

### Cosmetics
- [ ] Unlockable chef outfits (pirate chef, space chef, etc.)
- [ ] Platform skins
- [ ] Trail effects
- [ ] Custom meatball variants

---

## Technical

### Performance
- [ ] Replace `window.location.reload()` restart with state reset
- [ ] Object pooling for particles (currently creating/destroying Graphics each frame)
- [ ] Batch rendering for platforms and meatballs
- [ ] Profile and optimize for 60fps on low-end devices
- [ ] Reduce GC pressure from spread operators in hot paths

### Infrastructure
- [ ] Service worker for offline play (PWA)
- [ ] Update GitHub Pages build with latest changes
- [ ] CI pipeline (run tests + build on PR)
- [ ] Error tracking (Sentry or similar)
- [ ] Analytics (play count, avg score, zone reach rates)

### Code Quality
- [ ] Extract magic numbers into named constants
- [ ] Split GameScene.ts (currently very large) into subsystems
- [ ] Add integration tests for full game loop scenarios
- [ ] Add visual regression tests (screenshot comparison)
- [ ] Document the architecture in AGENTS.md

### Mobile
- [ ] Haptic feedback for impacts, power-ups, death (Vibration API)
- [ ] Better touch controls as tilt fallback (virtual joystick)
- [ ] PWA install prompt
- [ ] iOS home screen icon + splash screen
- [ ] Android TWA wrapper for Play Store

---

## Quick Wins (low effort, high impact)
- [ ] Spaghetti spring unique sprite
- [ ] Magnet attraction particles
- [ ] Per-power-up SFX
- [ ] State-based restart (no reload)
- [ ] GitHub Pages deploy update
- [ ] Achievement: "First flight" on collecting first power-up
