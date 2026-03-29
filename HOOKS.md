# HOOKS.md — Lifecycle automation for any agent

This project uses lifecycle hooks to automate health checks, context management, and change
tracking. Hook support varies by agent:

| Agent | Support | Config location |
|-------|---------|-----------------|
| Claude Code | Full (12 events, shell scripts) | `.claude/settings.json` + `.claude/hooks/` |
| OpenCode | Partial (session start/end + plugins) | `.opencode/config.json` + `.opencode/hooks/` |
| Cursor | None (rules only) | `.cursor/rules/` |
| Windsurf | None (rules only) | `.windsurf/rules/` |
| Copilot | None | `.github/copilot-instructions.md` |
| Online (ChatGPT, Gemini, etc.) | None | `bundle.xml` via repomix |

If your agent has no hook support, use this file as a manual checklist. The behaviors
below are what hooks automate — do them by hand at the appropriate moment.

---

## What each hook does and when to do it manually

### On session start
**Automated by:** Claude Code `SessionStart`, OpenCode `session_start`
**Do manually:** At the start of every session, read:
1. `SESSION_SUMMARY.md` — what happened last session and what's next
2. The last 3 entries in `CHANGES.md` — recent symbol changes and dead code signals

### After editing a file
**Automated by:** Claude Code `PostToolUse`
**Do manually:** After editing a source file:
1. Check the file's LOC against limits in `docs/code-health.md`
2. Confirm no `console.log` was introduced
3. Format the file if your editor doesn't auto-format

### Before compressing context
**Automated by:** Claude Code `PreCompact`
**Do manually:** Before starting a new session or compressing context:
1. Run `bash scripts/analyze-changes.sh` — detects dead code from CHANGES.md
2. Fill in "Next steps" in `SESSION_SUMMARY.md`
3. Ensure CHANGES.md has an entry for the current session (if full mode)

### At session end
**Automated by:** Claude Code `Stop`, OpenCode `session_end`
**Do manually:** Before ending a session:
1. Append an entry to `CHANGES.md` if you removed symbols or are in full mode
2. Run `make check` if you haven't already
3. Update "Next steps" in `SESSION_SUMMARY.md`

---

## Contributing hook support for a new agent

If you're adding support for a new agent:

1. Create `.agentname/hooks/` mirroring the structure of `.claude/hooks/`
2. The same shell scripts in `base/.claude/hooks/` can be reused — they're agent-agnostic
3. Add wiring config in whatever format the agent expects
4. Document the agent in the table above
5. Open a PR — see `CONTRIBUTING.md`
