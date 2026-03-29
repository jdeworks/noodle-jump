# Architecture — how the starter kit works

This doc explains the layering system for contributors.

## Four layers

```
┌─────────────────────────────────────┐
│  Your project code                  │  ← You write this
├─────────────────────────────────────┤
│  Starter (pixijs/, hono/, expo/...) │  ← Working hello-world code
├─────────────────────────────────────┤
│  Variant (website/, saas/...)       │  ← Project-type rules + docs
├─────────────────────────────────────┤
│  Base (base/)                       │  ← Universal quality layer
└─────────────────────────────────────┘
```

### Base layer (`base/`)

Shared by every project. Contains:
- `AGENTS.md` — entry point with mode declaration, key commands, doc table, rules
- `CLAUDE.md` — redirects to AGENTS.md
- `.claude/hooks/` — lifecycle automation (session-start, post-edit, pre-compact, stop)
- `.claude/settings.json` — hook wiring
- `.opencode/` — OpenCode hooks and commands
- `.cursor/`, `.windsurf/` — minimal redirects to AGENTS.md
- `.github/copilot-instructions.md` — redirect to AGENTS.md
- `scripts/` — health-check.sh, analyze-changes.sh
- `docs/` — reference docs (code-health, testing, changelog-protocol, etc.)
- `Makefile` — task runner with standard targets
- `CHANGES.md`, `SESSION_SUMMARY.md` — lifecycle files
- `repomix.config.json` — bundle config for online AI agents

### Variant layer (`website/`, `api-service/`, etc.)

Adds project-type-specific guidance:
- `AGENTS.md` — extends base with variant-specific rules, doc table, LOC overrides
- `docs/` — topic docs (stack-choice, deployment, testing patterns, etc.)

Variant files are **merged on top of base** by `cli/compose.sh`. Variant AGENTS.md
replaces the base AGENTS.md (it contains the base's `<!-- FILL IN -->` sections
completed with variant-specific content).

### Starter layer (`<variant>/starters/<engine>/`)

Working hello-world code for a specific engine or framework. Each starter:
- Runs immediately after install + dev command
- Has at least 1 passing test
- Follows kit principles (small files, separation of concerns)
- Includes package.json/pyproject.toml with scripts mapping to Makefile targets

Starters are discovered via `<variant>/starters/starters.json` — a manifest read by both
the CLI (interactive picker) and LLM agents (JSON parsing).

### Your project

After composing, you have a running project with quality infrastructure. Fill in the
project overview in AGENTS.md and start building on top of the starter code.

## CLI flow

```
cli/init.sh      → creates dir + git init + calls compose.sh
cli/compose.sh   → copies base/ + variant/ + starter/ into target, sets mode
cli/migrate.sh   → analyzes existing repo, writes MIGRATION.md
cli/upgrade.sh   → switches lean → full mode
cli/status.sh    → shows kit health
cli/validate.sh  → verifies doc references and hooks
cli/help.sh      → unified help
```

## Modes

| Mode | What's active |
|------|--------------|
| **full** | 3 test tiers, all hooks, CHANGES.md required, make check mandatory |
| **lean** | Feature tests only, reduced hooks, CHANGES.md optional |

Mode is declared in AGENTS.md and can be switched mid-session.

## Hook lifecycle

```
SessionStart  → inject SESSION_SUMMARY.md + recent CHANGES.md
PostToolUse   → health check warning + auto-format (on Edit/Write)
PreCompact    → analyze dead code + remind about SESSION_SUMMARY.md
Stop          → remind to write CHANGES.md entry
```

Hooks are non-blocking (they warn, not fail) except health-check hard failures.

## File ownership

- `base/` — shared, should not be modified by variant PRs
- `<variant>/` — variant-specific, can be modified independently
- `cli/` — tooling, shared across all variants
- Root files (AGENTS.md, CHANGES.md, etc.) — project-specific when self-hosting
