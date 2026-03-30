#!/usr/bin/env bash
# stop.sh — runs when Claude Code finishes responding
# Reminds about CHANGES.md completion via additionalContext
# Triggered by: Stop
set -uo pipefail

[ ! -f "CHANGES.md" ] && exit 0

# Detect mode
mode="full"
if [ -f "AGENTS.md" ] && grep -q 'Default: \*\*lean\*\*' AGENTS.md 2>/dev/null; then
  mode="lean"
fi

# Only check entries after the marker to skip template examples
entries_section=$(sed -n '/<!-- Entries below/,$p' CHANGES.md 2>/dev/null || echo "")

# Find the most recent "started" entry and check if it has a matching "completed"
last_started_sid=$(echo "$entries_section" | grep 'status: started' | tail -1 | sed -n 's/.*session-\([^ |]*\).*/\1/p')

if [ -n "$last_started_sid" ]; then
  if echo "$entries_section" | grep -q "session-$last_started_sid | status: completed" 2>/dev/null; then
    # Session properly completed — all good
    exit 0
  fi
fi

# No completed entry for the current/last session
if [ "$mode" = "full" ]; then
  MSG="--- CHANGES.md: session not completed ---
You have a started session without a completed entry.
In full mode, you MUST append a completed entry to CHANGES.md before finishing.

Format:
## [$(date +%Y-%m-%dT%H:%M)] session-${last_started_sid:-xxxx} | status: completed | mode: full | type: add|fix|refactor|chore
files_touched: <files you changed>
symbols_added: <new exports>
symbols_removed: <deleted exports>
tests_added: <test files>
reason: <one sentence>
health_snapshot: LOC=<n>, tests=<n>, complexity=ok|warn|fail

See .kit/changelog-protocol.md for details.
---"

  escaped=$(printf '%s' "$MSG" | python3 -c "import sys,json; sys.stdout.write(json.dumps(sys.stdin.read()))" 2>/dev/null || printf '"%s"' "$MSG")
  printf '{"additionalContext": %s}\n' "$escaped"
  exit 1
fi

# Lean mode — just a gentle reminder
MSG="--- Session end reminder (lean mode) ---
Consider logging this session in CHANGES.md if you removed or renamed any symbols.
---"

escaped=$(printf '%s' "$MSG" | python3 -c "import sys,json; sys.stdout.write(json.dumps(sys.stdin.read()))" 2>/dev/null || printf '"%s"' "$MSG")
printf '{"additionalContext": %s}\n' "$escaped"

exit 0
