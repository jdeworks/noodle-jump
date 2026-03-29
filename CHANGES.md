# CHANGES.md

Session log with start/end tracking. Every session creates a **started** entry at the
beginning and a **completed** entry at the end. If a session is interrupted, the next
session sees the orphaned "started" entry and can pick up where it left off.

**Start entry (write when you begin work):**
```
## [YYYY-MM-DDTHH:MM] session-<id> | status: started | mode: full|lean | type: add|fix|refactor|chore
intent: One line describing what this session will do
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
- Write the **completed** entry when you finish — `symbols_removed` is mandatory if you deleted code.
- Use the same `session-<id>` for both start and end entries.
- `tests_added` is required for `type: fix` — every fix needs a regression test.
- Do not edit past entries. Append only.
- See `docs/changelog-protocol.md` for full details.

---
<!-- Entries below — newest at bottom -->
