# Changelog protocol

CHANGES.md is a machine-readable session log with **start/end tracking**. Every session
creates a "started" entry at the beginning and a "completed" entry at the end. If a session
is interrupted, the orphaned "started" entry tells the next session what was in progress.

---

## Session lifecycle

```
Session begins
  → Write "started" entry with intent
  → Do the work
  → Write "completed" entry with results
Session ends
```

If the session crashes or is interrupted, the next session's `session-start.sh` hook detects
the orphaned "started" entry and flags it. The new session can then complete it or mark it
as abandoned.

---

## When to write entries

**Always write a started entry when:**
- You begin any work session (the session-start hook will prompt you)

**Always write a completed entry when:**
- A session ends in full mode (the stop hook will block until you do)
- You removed, renamed, or restructured symbols (any mode)
- You refactored something touching more than 3 files

**You may skip the completed entry when:**
- Session is lean mode and you only added new code (no removals)
- You only changed comments, formatting, or config values

---

## Format

**Start entry:**
```
## [YYYY-MM-DDTHH:MM] session-<id> | status: started | mode: full|lean | type: add|fix|refactor|chore
intent: One line describing what this session will do
```

**Completed entry:**
```
## [YYYY-MM-DDTHH:MM] session-<id> | status: completed | mode: full|lean | type: add|fix|refactor|chore
files_touched: path/to/file.ts, path/to/other.ts
symbols_added: ExportedFunctionName, ExportedClassName
symbols_removed: OldFunctionName, RemovedType
tests_added: path/to/new.test.ts
reason: One sentence. Include whether removed symbols were cleaned up or left for later.
health_snapshot: LOC=4234, tests=312, complexity=ok|warn|fail
```

**Session ID:** Use 4 alphanumeric characters (e.g. `a1b2`). Same ID for both start and end.

**Status values:**
- `started` — session is in progress
- `completed` — session finished normally
- `abandoned` — session was interrupted and won't be completed (write this to close an orphan)

---

## Fields

**`intent`** (started entry) — One line describing the goal. This is what the next session
sees if you get interrupted.

**`files_touched`** — Comma-separated list of files modified this session.

**`symbols_added`** / **`symbols_removed`** — Exported functions, classes, types, constants.
`symbols_removed` is mandatory whenever code is deleted — this is how dead code is tracked.

**`tests_added`** — New test files or test cases. Required for `type: fix` entries — every
fix must have a regression test.

**`reason`** — One sentence summary. Keep it brief; detail belongs in commit messages.

**`health_snapshot`** — Quick health metrics: total LOC, total tests, complexity status.

---

## Types

- `add` — new features, new files, new exports
- `fix` — bug fix (requires `tests_added`)
- `refactor` — restructured without changing behaviour
- `chore` — deps, config, CI, tooling

---

## What counts as a symbol

A symbol is anything exported and importable from another file:
- Functions: `export function doThing()`
- Classes: `export class MyService`
- Types/interfaces: `export type Foo`, `export interface Bar`
- Constants: `export const MAX_RETRIES`
- Default exports: `export default MyComponent`

Internal (non-exported) functions don't need tracking.

---

## Example: normal session

```
## [2026-03-28T14:30] session-a1b2 | status: started | mode: full | type: refactor
intent: Replace OldAuthHandler with LoginForm + SessionStore pattern

## [2026-03-28T15:45] session-a1b2 | status: completed | mode: full | type: refactor
files_touched: src/auth/login.ts, src/auth/types.ts, src/auth/session.ts
symbols_added: LoginForm, validateToken, SessionStore
symbols_removed: OldAuthHandler, legacyLogin, AuthContext
tests_added: src/auth/login.test.ts, src/auth/session.test.ts
reason: Replaced OldAuthHandler with LoginForm + SessionStore. All removed symbols confirmed unused.
health_snapshot: LOC=4102, tests=287, complexity=ok
```

## Example: interrupted session (next session picks up)

```
## [2026-03-28T14:30] session-c3d4 | status: started | mode: full | type: fix
intent: Fix webhook handler processing duplicate Stripe events

## [2026-03-28T16:00] session-e5f6 | status: started | mode: full | type: fix
intent: Completing abandoned session-c3d4 — webhook duplicate fix

## [2026-03-28T16:30] session-c3d4 | status: abandoned | mode: full | type: fix
reason: Session interrupted. Continued in session-e5f6.

## [2026-03-28T17:00] session-e5f6 | status: completed | mode: full | type: fix
files_touched: src/billing/webhook.ts
symbols_added: (none)
symbols_removed: (none)
tests_added: src/billing/webhook.test.ts
reason: Added idempotency check on event ID. Regression test confirms duplicates skipped.
health_snapshot: LOC=4110, tests=289, complexity=ok
```

---

## How hooks use this file

- **session-start.sh** — Detects orphaned "started" entries, injects them into context
- **stop.sh** — In full mode, blocks (exit 1) if no "completed" entry exists
- **pre-compact.sh** — Runs `scripts/analyze-changes.sh` to detect dead code from `symbols_removed`
- **verify-changes.sh** — Validates that test files referenced in `tests_added` actually exist

---

## Keeping it honest

The value degrades fast with vague entries. These are bad:
- `reason: refactored some stuff` — useless
- `symbols_removed: (none)` when you deleted 3 functions — dishonest
- Missing `tests_added` on a fix entry — violates the regression test rule

When in doubt: log too much. Future sessions will thank you.
