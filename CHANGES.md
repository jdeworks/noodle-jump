# CHANGES.md

Session log with progressive tracking. Every session creates a **started** entry at the
beginning, **progress** lines as work happens, and a **completed** entry at the end.
If a session is interrupted, the next session sees the orphaned "started" entry plus any
progress lines — so it knows exactly what was done.

**Start entry (write before doing any work):**

```
## [YYYY-MM-DDTHH:MM] session-<id> | status: started | mode: full|lean | type: add|fix|refactor|chore
intent: One line describing what this session will do
```

**Progress lines (append after each logical unit of work):**

```
- progress: <what was done> | <files touched>
- progress: Replaced OldThing with NewThing | src/foo.ts (removed: OldThing)
```

**End entry (write when work is done):**

```
## [YYYY-MM-DDTHH:MM] session-<id> | status: completed | mode: full|lean | type: add|fix|refactor|chore
files_touched: path/to/file.ts, path/to/other.ts
symbols_added: FunctionName, ClassName
symbols_removed: OldFunction, DeprecatedClass
tests_added: path/to/test.ts
reason: One sentence. Note whether removed symbols were cleaned up or left for later.
health_snapshot: LOC=<n>, tests=<n>, complexity=ok|warn|fail
```

**Rules:**

- Write the **started** entry first — before doing any work.
- **Log progress as you go** — after each completed chunk, before moving to the next task.
- Write the **completed** entry when you finish — `symbols_removed` is mandatory if you deleted code.
- Note removed symbols in progress lines: `(removed: SymbolName)` — feeds dead code detection.
- Use the same `session-<id>` for both start and end entries.
- `tests_added` is required for `type: fix` — every fix needs a regression test.
- Do not edit past entries. Append only.
- See `.kit/changelog-protocol.md` for full details.

---

<!-- Entries below — newest at bottom -->

## [2026-03-30T11:35] session-x7k2 | status: abandoned | mode: full | type: add

reason: Session interrupted without completion. Work continued across 42 commits (see git log). Staged changes caused silent breakage across subsequent sessions.

## [2026-04-01T10:00] session-b3f7 | status: started | mode: full | type: fix

intent: Fix drill safety, boss fight screen locking, music overlap, menu visibility, and double-tap zoom

## [2026-04-01T10:30] session-b3f7 | status: completed | mode: full | type: fix

files_touched: src/systems/PowerUpEffects.ts, src/systems/Camera.ts, src/scenes/GameLoop.ts, src/scenes/GameLoopHelpers.ts, src/systems/MusicPlayer.ts, src/systems/Audio.ts, src/scenes/GameLauncher.ts, src/services/PWA.ts, src/ui/TitleScreenView.ts, src/ui/ExplanationScreen.ts, src/ui/CustomRunScreen.ts, index.html, tests/camera.test.ts, tests/powerup-effects.test.ts
symbols_added: killBossMusic
symbols_removed: (none)
tests_added: tests/camera.test.ts (boss lock), tests/powerup-effects.test.ts (drill safety)
reason: Fixed drill destroying landing platforms, camera/platform-gen not locking during boss fights, music overlap on death/restart, title screen content visible behind sub-menus, and double-tap zoom on mobile.
health_snapshot: LOC=9800, tests=689, complexity=ok

## [2026-04-01T12:00] session-a1d4 | status: started | mode: lean | type: add

intent: Debug mode UI, boss fight overhaul, remove drill, fix music overlap

- progress: Enable DEBUG_MODE, add debug options to Custom Run screen | src/config/constants.ts, src/ui/CustomRunScreen.ts, src/scenes/GameState.ts
- progress: Remove rigatoni drill from spawn lists | src/entities/PowerUp.ts, src/systems/CustomRunConfig.ts (removed: rigatoni_drill from POSITIVE_TYPES, ALL_POWER_UP_TYPES)
- progress: Fix button text cursor on title screen | src/ui/TitleScreenView.ts
- progress: Add localStorage persistence, presets, reset, scrolling to Custom Run | src/ui/CustomRunScreen.ts
- progress: Wire forcePowerUpType into spawn system | src/entities/PowerUp.ts, src/scenes/GameLoopHelpers.ts
- progress: Fix quick zone transitions formula (direct zone calc) | src/scenes/GameLoop.ts
- progress: Fix boss Y-bounds (Kraken, UFO track player), ChefRival visibility constraint | src/entities/bosses/KrakenBoss.ts, src/entities/bosses/UFOBoss.ts, src/entities/bosses/ChefRivalBoss.ts
- progress: Implement FPS counter in HUD | src/ui/HUD.ts
- progress: Implement hitbox debug rendering (player, platforms, powerups, meatballs, enemies, boss) | src/scenes/GameScene.ts
- progress: Fix knife rendering during boss fights, knife ammo as mini icons | src/scenes/GameScene.ts, src/scenes/EntityRenderer.ts
- progress: Fix music overlap — track/cancel fade intervals, stop all music on death | src/systems/MusicPlayer.ts, src/scenes/GameLoopTicker.ts, src/scenes/GameSceneEvents.ts
- progress: Boss fight arena — break off-screen platforms, boss grace period, safe powerups | src/scenes/GameLoopBoss.ts
- progress: Fix activeBoss not nulled on kill (blocked subsequent bosses) | src/scenes/GameLoopBoss.ts
- progress: Kraken rework — tentacle extend/hold/remove animation, escalating speed, edge-only, sliver-then-destroy | src/entities/bosses/KrakenBoss.ts, src/scenes/GameLoopBoss.ts, src/scenes/GameScene.ts, src/scenes/GameState.ts
- progress: UFO aimed projectiles at player with spread shot | src/entities/bosses/UFOBoss.ts
- progress: Split GameScene.ts and CustomRunScreen.ts for LOC limits | src/scenes/BossArenaRenderer.ts, src/ui/CustomRunStorage.ts
- progress: Fix tests for drill removal and bossTestPreset change | tests/custom-run-config.test.ts, tests/debug-config.test.ts, tests/wiring.test.ts

## [2026-04-01T14:10] session-a1d4 | status: completed | mode: lean | type: add

files_touched: src/config/constants.ts, src/config/debug.ts, src/entities/PowerUp.ts, src/entities/bosses/ChefRivalBoss.ts, src/entities/bosses/KrakenBoss.ts, src/entities/bosses/UFOBoss.ts, src/scenes/GameLoop.ts, src/scenes/GameLoopBoss.ts, src/scenes/GameLoopHelpers.ts, src/scenes/GameLoopTicker.ts, src/scenes/GameScene.ts, src/scenes/GameSceneEvents.ts, src/scenes/GameSceneRender.ts, src/scenes/GameState.ts, src/systems/CustomRunConfig.ts, src/systems/MusicPlayer.ts, src/ui/CustomRunScreen.ts, src/ui/CustomRunStorage.ts, src/ui/HUD.ts, src/ui/TitleScreenView.ts, src/scenes/BossArenaRenderer.ts, tests/custom-run-config.test.ts, tests/debug-config.test.ts, tests/wiring.test.ts
symbols_added: BossArenaRenderer (renderTentacles, renderKnifeAmmo, renderDebugHitboxes), CustomRunStorage (saveRunConfigToStorage, loadRunConfigFromStorage, saveDebugConfigToStorage, loadDebugConfigFromStorage, addSectionHeader, addRow, addToggleRow, addPresetRow, buildPresets, addPowerUpGrid, createBottomBar), pendingTentacles (GameWorldState)
symbols_removed: rigatoni_drill (from POSITIVE_TYPES, ALL_POWER_UP_TYPES), infiniteKnives (from bossTestPreset)
tests_added: (updated existing: tests/custom-run-config.test.ts, tests/debug-config.test.ts, tests/wiring.test.ts)
reason: Added debug mode UI with presets/persistence, overhauled all 3 boss fights (grace period, arena locking, tentacle animations, aimed projectiles), removed drill power-up, fixed music overlap and knife rendering.
health_snapshot: LOC=16124, tests=346, complexity=ok

## [2026-04-01T15:15] session-mp01 | status: started | mode: lean | type: add

intent: Stage 1 — Multiplayer networking layer (signaling strategies, connection manager, game sync)

- progress: SignalingStrategy interface, ManualSignaling (SDP compression via pako+base62), NostrSignaling (Trystero wrapper), ConnectionManager, GameSync (binary position + events) | src/multiplayer/SignalingStrategy.ts, src/multiplayer/ManualSignaling.ts, src/multiplayer/NostrSignaling.ts, src/multiplayer/ConnectionManager.ts, src/multiplayer/GameSync.ts, src/multiplayer/SDPCompressor.ts, src/multiplayer/index.ts
- progress: Unit tests for SDP compression round-trip, base62 encoding, position encoding/decoding | tests/multiplayer/sdp-compressor.test.ts, tests/multiplayer/game-sync.test.ts
- progress: LocalInput (split keyboard P1=WASD, P2=Arrows), MultiplayerSession (two states, shared seed, winner logic), LocalCoopLauncher (split-screen with masks, death toasts, results/rematch) | src/multiplayer/LocalInput.ts, src/multiplayer/MultiplayerSession.ts, src/multiplayer/LocalCoopLauncher.ts
- progress: Added updateWithInput() to GameScene for external input control | src/scenes/GameScene.ts
- progress: Tests for LocalInput and MultiplayerSession | tests/multiplayer/local-input.test.ts, tests/multiplayer/multiplayer-session.test.ts
- progress: InterpolationBuffer (lerp+extrapolation for 20Hz→60FPS), RemotePlayerRenderer (ghost chef + off-screen arrows), OnlineSession (wires networking to game loop with death events, results, rematch) | src/multiplayer/InterpolationBuffer.ts, src/multiplayer/RemotePlayerRenderer.ts, src/multiplayer/OnlineSession.ts
- progress: InterpolationBuffer tests | tests/multiplayer/interpolation-buffer.test.ts
- progress: LobbyScreen (ready-up, host controls, start), MultiplayerMenu + ConnectFlows (create/join for Quick/Private Connect, DSGVO info text), Multiplayer button on title screen | src/multiplayer/LobbyScreen.ts, src/multiplayer/MultiplayerMenu.ts, src/multiplayer/ConnectFlows.ts, src/ui/TitleScreenView.ts
- progress: Lobby/session integration tests | tests/multiplayer/lobby-session.test.ts
- progress: Ghost tinting (orange/green), spectate after death, auto-aim shooting (E/Q and Space), mode selection in lobby, Escape to forfeit, FPS debug-only | src/multiplayer/\*.ts, src/scenes/GameScene.ts
- progress: Ghost mode (keep playing after death, frozen scoring), mode picker for local co-op, game mode logic (first-to-die, timed 2min, best-height), connection quality dot | src/scenes/GameLoop.ts, src/scenes/GameState.ts, src/multiplayer/ModePickerScreen.ts, src/multiplayer/LocalCoopLauncher.ts, src/multiplayer/OnlineSession.ts, src/multiplayer/InterpolationBuffer.ts

## [2026-04-01T16:22] session-mp01 | status: completed | mode: lean | type: add

files_touched: src/multiplayer/SignalingStrategy.ts, src/multiplayer/ManualSignaling.ts, src/multiplayer/NostrSignaling.ts, src/multiplayer/SDPCompressor.ts, src/multiplayer/ConnectionManager.ts, src/multiplayer/GameSync.ts, src/multiplayer/LocalInput.ts, src/multiplayer/MultiplayerSession.ts, src/multiplayer/LocalCoopLauncher.ts, src/multiplayer/InterpolationBuffer.ts, src/multiplayer/RemotePlayerRenderer.ts, src/multiplayer/OnlineSession.ts, src/multiplayer/LobbyScreen.ts, src/multiplayer/MultiplayerMenu.ts, src/multiplayer/ConnectFlows.ts, src/multiplayer/index.ts, src/scenes/GameScene.ts, src/ui/TitleScreenView.ts, tests/multiplayer/\*.ts
symbols_added: SignalingStrategy, ManualSignaling, NostrSignaling, SDPCompressor (compressSDP, decompressSDP, toBase62, fromBase62, compressDescription, decompressDescription), ConnectionManager, GameSync (encodePosition, decodePosition), LocalInput, MultiplayerSession, launchLocalCoop, InterpolationBuffer, RemotePlayerRenderer, OnlineSession, LobbyScreen, MultiplayerMenu, ConnectFlows (doQuickCreate, doQuickJoin, doPrivateCreate, doPrivateJoin, setupConnectionCallbacks), updateWithInput (GameScene)
symbols_removed: (none)
tests_added: tests/multiplayer/sdp-compressor.test.ts, tests/multiplayer/game-sync.test.ts, tests/multiplayer/local-input.test.ts, tests/multiplayer/multiplayer-session.test.ts, tests/multiplayer/interpolation-buffer.test.ts, tests/multiplayer/lobby-session.test.ts
reason: Full multiplayer networking layer — all 5 stages complete. Dual signaling (Nostr + manual SDP), local co-op split-screen, online P2P with interpolation, lobby with ready-up, and title screen integration.
health_snapshot: LOC=19800, tests=383, complexity=ok

## [2026-04-05T14:50] session-dc01 | status: started | mode: full | type: add

intent: Implement Daily Challenge (date-seeded runs, medals, streaks, achievements) and Shadow Replay (record/playback ghost on all runs)

- progress: Pure logic — DailyChallengeState (config gen, medals, streaks), ShadowRecorder, ShadowPlayback + tests | src/systems/DailyChallengeState.ts, src/systems/ShadowRecorder.ts, src/systems/ShadowPlayback.ts, tests/daily-challenge-state.test.ts, tests/shadow-recorder.test.ts, tests/shadow-playback.test.ts
- progress: UI screens — DailyChallengeScreen, DailyGameOverView | src/ui/DailyChallengeScreen.ts, src/ui/DailyGameOverView.ts
- progress: Integration — Daily button on title screen, shadow recorder/playback in GameLauncher/GameLoopTicker, daily achievements | src/ui/TitleScreenView.ts, src/scenes/GameLauncher.ts, src/scenes/GameLoopTicker.ts, src/systems/Achievements.ts
- progress: Extract TitleScreenMenus and PauseMenu for LOC limits | src/ui/TitleScreenMenus.ts, src/scenes/PauseMenu.ts

## [2026-04-05T15:10] session-dc01 | status: completed | mode: full | type: add
files_touched: src/systems/DailyChallengeState.ts, src/systems/ShadowRecorder.ts, src/systems/ShadowPlayback.ts, src/ui/DailyChallengeScreen.ts, src/ui/DailyGameOverView.ts, src/ui/TitleScreenView.ts, src/ui/TitleScreenMenus.ts, src/scenes/GameLauncher.ts, src/scenes/GameLoopTicker.ts, src/scenes/PauseMenu.ts, src/systems/Achievements.ts, TASKS.md
symbols_added: generateDailyConfig, getMedalThresholds, getMedal, recordDailyResult, calculateStreak, getDailyConfigSummary, getTodayDateKey, getMedalsInRange, loadDailyData, saveDailyData, DailyChallengeScreen, showDailyGameOver, createShadowRecorder, getSampleCount, getFrame, saveLastShadow, saveBestShadow, saveDailyShadow, loadLastShadow, loadBestShadow, loadDailyShadow, createShadowPlayback, getShadowContext, setupTitleMenus, createPauseMenu
symbols_removed: (none)
tests_added: tests/daily-challenge-state.test.ts, tests/shadow-recorder.test.ts, tests/shadow-playback.test.ts
reason: Daily Challenge (date-seeded config, medals, streaks, 5 achievements, dedicated game-over screen) and Shadow Replay (records all runs, plays ghost on next run via RemotePlayerRenderer).
health_snapshot: LOC=28097, tests=447, complexity=ok

## [2026-04-05T15:15] session-dc02 | status: started | mode: full | type: fix
intent: Increase daily challenge difficulty — higher thresholds, more modifiers, platinum+diamond medals
- progress: Higher base thresholds (5k/15k/30k/50k/80k), add platinum+diamond medals, randomize game speed/platform type/spawn rates/quick zones/only-negative-powerups | src/systems/DailyChallengeState.ts, src/ui/DailyChallengeScreen.ts, src/ui/DailyGameOverView.ts, src/systems/Achievements.ts, src/scenes/GameLauncher.ts, tests/daily-challenge-state.test.ts
