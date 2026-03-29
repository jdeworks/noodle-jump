#!/usr/bin/env bash
# verify-changes.sh — cross-reference CHANGES.md against git history and test files
# Checks: tests_added files exist, fix entries have tests, patterns in fix frequency
set -euo pipefail

CHANGES_FILE=${CHANGES_FILE:-CHANGES.md}
SRC_DIR=${SRC_DIR:-src}

WARN=0
FAIL=0

log_warn() { echo "WARN: $*"; WARN=$((WARN+1)); }
log_fail() { echo "FAIL: $*" >&2; FAIL=$((FAIL+1)); }

if [ ! -f "$CHANGES_FILE" ]; then
  echo "No CHANGES.md found — skipping verification."
  exit 0
fi

echo "==> Verifying CHANGES.md entries..."

# ── Check tests_added files actually exist ───────────────────────────────────
echo ""
echo "--- Checking tests_added references ---"
tests_checked=0
while IFS= read -r line; do
  tests_list=$(echo "$line" | sed 's/^tests_added: //')
  [ "$tests_list" = "(none)" ] && continue
  IFS=',' read -ra test_files <<< "$tests_list"
  for tf in "${test_files[@]}"; do
    tf=$(echo "$tf" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    # Strip any parenthetical notes like "(added: ...)"
    tf=$(echo "$tf" | sed 's/ *(.*)//')
    [ -z "$tf" ] && continue
    tests_checked=$((tests_checked + 1))
    if [ ! -f "$tf" ]; then
      log_warn "tests_added references '$tf' but file does not exist"
    fi
  done
done < <(grep '^tests_added:' "$CHANGES_FILE" 2>/dev/null || true)

if [ "$tests_checked" -eq 0 ]; then
  echo "  No tests_added entries found."
else
  echo "  Checked $tests_checked test file reference(s)."
fi

# ── Check fix entries have tests_added ───────────────────────────────────────
echo ""
echo "--- Checking fix entries have regression tests ---"
fix_count=0
fix_without_tests=0

while IFS= read -r header; do
  if echo "$header" | grep -q 'type: fix'; then
    fix_count=$((fix_count + 1))
    # Get the line number of this header, then look for tests_added in next 8 lines
    line_num=$(grep -n "$header" "$CHANGES_FILE" | head -1 | cut -d: -f1)
    if [ -n "$line_num" ]; then
      block=$(sed -n "$((line_num)),$(( line_num + 8 ))p" "$CHANGES_FILE")
      if ! echo "$block" | grep -q '^tests_added:' || echo "$block" | grep -q 'tests_added: (none)'; then
        session_id=$(echo "$header" | grep -oP 'session-\S+' | head -1)
        log_warn "Fix entry $session_id has no tests_added — regression test missing"
        fix_without_tests=$((fix_without_tests + 1))
      fi
    fi
  fi
done < <(grep '^## \[' "$CHANGES_FILE" 2>/dev/null || true)

echo "  Found $fix_count fix entries, $fix_without_tests without regression tests."

# ── Detect hotspot areas (files with repeated fixes) ─────────────────────────
echo ""
echo "--- Checking for hotspot areas (repeated fixes) ---"

declare -A file_fix_count 2>/dev/null || true
if declare -A file_fix_count 2>/dev/null; then
  # bash 4+ with associative arrays
  current_type=""
  while IFS= read -r line; do
    if echo "$line" | grep -q '^## \[.*type: fix'; then
      current_type="fix"
    elif echo "$line" | grep -q '^## \['; then
      current_type=""
    elif [ "$current_type" = "fix" ] && echo "$line" | grep -q '^files_touched:'; then
      files_list=$(echo "$line" | sed 's/^files_touched: //')
      IFS=',' read -ra touched <<< "$files_list"
      for f in "${touched[@]}"; do
        f=$(echo "$f" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        # Extract directory (first two path components)
        dir=$(echo "$f" | cut -d/ -f1-2)
        [ -n "$dir" ] && file_fix_count[$dir]=$(( ${file_fix_count[$dir]:-0} + 1 ))
      done
    fi
  done < "$CHANGES_FILE"

  hotspots=0
  for dir in "${!file_fix_count[@]}"; do
    count=${file_fix_count[$dir]}
    if [ "$count" -ge 3 ]; then
      log_warn "HOTSPOT: '$dir' has $count fix entries — this area needs better test coverage"
      hotspots=$((hotspots + 1))
    fi
  done

  if [ "$hotspots" -eq 0 ]; then
    echo "  No hotspot areas detected."
  fi
else
  echo "  (Skipped — requires bash 4+ for associative arrays)"
fi

# ── Cross-check with git if available ────────────────────────────────────────
echo ""
echo "--- Cross-checking symbols_removed against codebase ---"
removed_count=0
still_found=0

while IFS= read -r line; do
  symbols=$(echo "$line" | sed 's/^symbols_removed: //')
  [ "$symbols" = "(none)" ] && continue
  IFS=',' read -ra syms <<< "$symbols"
  for sym in "${syms[@]}"; do
    sym=$(echo "$sym" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    [ -z "$sym" ] && continue
    removed_count=$((removed_count + 1))
    if [ -d "$SRC_DIR" ] && grep -rq "\b${sym}\b" "$SRC_DIR" 2>/dev/null; then
      log_warn "Removed symbol '$sym' still found in source — possible dead code"
      still_found=$((still_found + 1))
    fi
  done
done < <(grep '^symbols_removed:' "$CHANGES_FILE" 2>/dev/null || true)

echo "  Checked $removed_count removed symbol(s), $still_found still found in source."

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Verification complete: $WARN warning(s), $FAIL failure(s)"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
