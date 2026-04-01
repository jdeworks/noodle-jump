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
