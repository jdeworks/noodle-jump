# Noodle Jump — Open Items

## Critical Bugs (must fix before multiplayer)
- [ ] **Knives still not visible in game** — graphics sync triggers every frame now but knives may still not render. Need to verify: (1) projectile creation works, (2) gfx is added to gameContainer, (3) z-order is above platforms. Add console.log in createProjectile to confirm.
- [ ] **Rigatoni drill can kill instantly** — drilling through breaking platforms can leave player with no way to recover. Consider: drill should not break platforms below, or player should be invulnerable during drill.
- [ ] **Boss health bar not fully visible** — confirm boss health bar renders and updates on hit.

## UI/UX Polish
- [ ] **Game over "Play Again" button** needs styled button background like title screen buttons
- [ ] **Power-up collect text** shows name but could show icon too
- [ ] **How to Play** — test scrolling on mobile thoroughly, ensure touch drag works smoothly
- [ ] **Desktop max-width** — verify 500px cap looks good on various screen sizes
- [ ] **Stats display** — format numbers with commas for large values (1,234 not 1234)
- [ ] **Boss fight** should lock screen / stop generating new platforms above until defeated
- [ ] **Last-run ghost/clone** — research replay recording approaches (store inputs per tick, not positions — much smaller)

## Gameplay
- [ ] **Drill safety** — rigatoni drill should not destroy breaking/brittle platforms, or player should get a bounce after drill ends
- [ ] **Boss encounter improvements** — Chef Rival needs more testing, Kraken tentacle grab visual, UFO projectile visual
- [ ] **Difficulty balance** — test all 7 zones thoroughly, ensure smooth progression
- [ ] **Per-zone dedicated music** — tracks assigned but need play-testing for mood fit

## Technical
- [ ] **PWA install prompt** — wire `showInstallPrompt()` to a UI button (currently deferred but never shown)
- [ ] **Performance audit** — platforms redraw every frame (was needed for zone colors), profile on low-end devices
- [ ] **Build + deploy** — `npx vite build` and push docs/ for GitHub Pages after all fixes
- [ ] **Turn off DEBUG_MODE** before production deploy

## Phase 11: Multiplayer (after all above)
- [ ] Local multiplayer (WASD + arrows on same keyboard)
- [ ] Server multiplayer via WebRTC
- [ ] Only start after all single-player features are tested and stable
