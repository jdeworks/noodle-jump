#!/usr/bin/env bash
# session-start.sh — runs at the start of every Claude Code session
# Injects session context: mode, abandoned sessions, recent history
# Triggered by: SessionStart
set -uo pipefail

output=""

# ── Self-check: verify hooks exist and kit version ───────────────────────────
warnings=""

# Check all hook scripts referenced in settings.json exist
if [ -f ".claude/settings.json" ]; then
  while IFS= read -r hook_path; do
    if [ ! -f "$hook_path" ]; then
      warnings+="  - Missing hook script: $hook_path\n"
    fi
  done < <(grep -o 'bash [^"]*\.sh' .claude/settings.json | sed 's/^bash //')
fi

# Check kit version and compare against remote
kit_version=""
if [ -f ".claude/KIT_VERSION" ]; then
  kit_version=$(tr -d '[:space:]' < .claude/KIT_VERSION)
else
  warnings+="  - Missing .claude/KIT_VERSION — run update.sh to install\n"
fi

if [ -n "$kit_version" ]; then
  remote_version=$(curl -sfL --max-time 2 \
    "https://raw.githubusercontent.com/jdeworks/project-starter-kit/dev/base/.claude/KIT_VERSION" 2>/dev/null | tr -d '[:space:]' || echo "")
  if [ -n "$remote_version" ] && [ "$remote_version" != "$kit_version" ]; then
    warnings+="  - Kit update available: $kit_version -> $remote_version (run update.sh)\n"
  fi
fi

if [ -n "$warnings" ]; then
  output+="### Starter-kit warnings\n${warnings}\n"
fi

# Inject SESSION_SUMMARY if it has content beyond the template
if [ -f "SESSION_SUMMARY.md" ]; then
  summary_lines=$(wc -l < SESSION_SUMMARY.md | tr -d ' ')
  if [ "$summary_lines" -gt 10 ]; then
    output+="$(cat SESSION_SUMMARY.md)\n\n"
  fi
fi

# Detect session mode from AGENTS.md
mode="full"
if [ -f "AGENTS.md" ] && grep -q 'Default: \*\*lean\*\*' AGENTS.md 2>/dev/null; then
  mode="lean"
fi

# Only look at real entries (after the marker), not template examples
entries_section=""
if [ -f "CHANGES.md" ]; then
  entries_section=$(sed -n '/<!-- Entries below/,$p' CHANGES.md 2>/dev/null || echo "")
fi

# Detect abandoned sessions (started but never completed)
abandoned=""
if [ -n "$entries_section" ]; then
  while IFS= read -r line; do
    sid=$(echo "$line" | sed -n 's/.*session-\([^ |]*\).*/\1/p')
    [ -z "$sid" ] && continue
    if ! echo "$entries_section" | grep -q "session-$sid | status: completed" 2>/dev/null; then
      intent=$(echo "$entries_section" | grep -A1 "session-$sid | status: started" | tail -1 | sed 's/^intent: //')
      abandoned+="  - session-$sid: $intent\n"
    fi
  done < <(echo "$entries_section" | grep 'status: started' 2>/dev/null)
fi

# Inject recent CHANGES.md entries
recent=""
if [ -n "$entries_section" ]; then
  recent=$(echo "$entries_section" | grep -A7 '^## \[' | tail -30 2>/dev/null || echo "")
  # Check for fix hotspots
  fix_areas=$(echo "$entries_section" | grep -B1 'type: fix' 2>/dev/null \
    | grep '^files_touched:' \
    | sed 's/files_touched: //' \
    | tr ',' '\n' \
    | sed 's/^[[:space:]]*//' \
    | cut -d/ -f1-2 \
    | sort | uniq -c | sort -rn \
    | head -3 \
    | awk '$1 >= 2 {print "  " $1 "x fixes in " $2}' 2>/dev/null || echo "")
fi

# Build context message
ctx="### Session info\nMode: **$mode**\n"
if [ -n "$abandoned" ]; then
  ctx+="### Abandoned sessions (started but never completed)\n${abandoned}"
  ctx+="Review these — complete or mark as abandoned before starting new work.\n\n"
fi
if [ -n "$recent" ]; then
  ctx+="\n### Recent session history\n${recent}\n"
fi
if [ -n "$fix_areas" ]; then
  ctx+="\n### Fix hotspots\n${fix_areas}\nConsider preventive tests in these areas.\n"
fi
ctx+="\n### Required action\n"
ctx+="Write a CHANGES.md **started** entry now with your session intent.\n"
ctx+="Format: ## [$(date +%Y-%m-%dT%H:%M)] session-<4chars> | status: started | mode: $mode | type: add|fix|refactor|chore\n"
ctx+="intent: <what you plan to do>\n"

output+="$ctx"

# Output as additionalContext JSON
if [ -n "$output" ]; then
  escaped=$(printf '%s' "$output" | python3 -c "import sys,json; sys.stdout.write(json.dumps(sys.stdin.read()))" 2>/dev/null || printf '"%s"' "$output")
  printf '{"additionalContext": %s}' "$escaped"
fi

exit 0
