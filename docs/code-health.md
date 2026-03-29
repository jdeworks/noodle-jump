# Code health

These rules exist so any agent (or human) can navigate the codebase without losing the thread.
Enforce them via `make health` and `make check`. Rules are checked automatically by hooks after edits.

## File size limits

| Type | Soft limit | Hard limit |
|------|-----------|------------|
| Source file | 250 LOC | 350 LOC |
| Test file | 400 LOC | 500 LOC |
| Config file | 100 LOC | 150 LOC |

When a file approaches the soft limit: split it. When it hits the hard limit: split it now, before
adding more code. The health-check script warns at soft, fails at hard.

**How to split:** Extract by responsibility, not by size. A 300-line file with one clear job is fine.
A 200-line file doing three unrelated things needs splitting even if it's under the limit.

## Function size limits

| Type | Soft limit | Hard limit |
|------|-----------|------------|
| Regular function | 60 LOC | 80 LOC |
| Complex handler / reducer | 100 LOC | 150 LOC |

Functions over the soft limit are a smell. Functions over the hard limit are a bug in the architecture.

## Complexity

- **Cyclomatic complexity ≤ 15** per function (enforced by ESLint or equivalent)
- **Nesting depth ≤ 4** (enforced by linter)
- **Parameters per function ≤ 5** — if you need more, use an options object

## Total LOC budget

Each variant sets its own budget in `scripts/health-check.sh`. The base default is:
- **5,000 LOC** for a lean project
- **15,000 LOC** for a full project

When you approach the budget, the health check warns. This is intentional — large codebases are
harder for LLMs to navigate. If you genuinely need more, raise the budget consciously, not by
ignoring the warning.

## Dead code

Dead code accumulates faster in AI-assisted projects because agents generate code in bursts
and don't always clean up what they replaced.

- Run `make deadcode` to detect unused exports, files, and dependencies (via knip)
- Check `CHANGES.md` — any `symbols_removed` entry that's more than 2 sessions old and
  still appears in grep results is confirmed dead code
- Dead code is not a style issue — it's a navigation tax on every future session

## What the health check does NOT enforce

- Naming conventions (handled by linter)
- Import order (handled by formatter)
- Type coverage (handled by TypeScript strict mode)

These belong in linter/formatter config, not in the health script.
