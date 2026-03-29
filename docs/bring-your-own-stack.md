# Bring your own stack

How to use the starter kit with a framework or language that isn't the variant's default example.

## The kit is stack-agnostic

The base layer (hooks, health checks, CHANGES.md, testing tiers) works with **any** language
or framework. Variant docs recommend a default stack as a concrete example, but the rules
and patterns are designed to transfer.

## Step-by-step: adapting the kit to your stack

### 1. Compose normally

```bash
bash cli/compose.sh --variant api-service --mode full --target /path/to/repo
```

### 2. Update AGENTS.md

Fill in the `Tech stack` section with your actual stack:
```markdown
## Tech stack
- Language: Go
- Framework: Chi
- Database: PostgreSQL
- Hosting: Docker + Fly.io
```

### 3. Update Makefile targets

The Makefile defines abstract targets. Map them to your stack's commands:

```makefile
# For Go
dev:      go run ./cmd/server
build:    go build -o bin/server ./cmd/server
test:     go test ./...
lint:     golangci-lint run
format:   gofmt -w .
types:    # Go is statically typed, no separate step needed
deadcode: deadcode ./...
```

```makefile
# For Python
dev:      uvicorn main:app --reload
build:    pip install -e .
test:     pytest
lint:     ruff check .
format:   ruff format .
types:    mypy .
deadcode: vulture .
```

```makefile
# For C#
dev:      dotnet run
build:    dotnet build
test:     dotnet test
lint:     dotnet format --verify-no-changes
format:   dotnet format
types:    # C# is statically typed
deadcode: # Use IDE analysis
```

### 4. Update health-check.sh extensions

Set the `SRC_EXTENSIONS` environment variable so the health check scans your files:

```bash
# In your Makefile or shell config
export SRC_EXTENSIONS=go
export SRC_EXTENSIONS=py
export SRC_EXTENSIONS=cs
export SRC_EXTENSIONS=rs
```

The console.log check only runs for JS/TS files — it's automatically skipped for other languages.

### 5. Update .gitignore

The default `.gitignore` is JS-oriented. Add your language's patterns:

```
# Go
/bin/
*.exe

# Python
__pycache__/
*.pyc
.venv/

# C#
bin/
obj/
*.user
```

### 6. Read the variant's stack-choice.md

Every variant has a `docs/stack-choice.md` with a mapping table showing how kit concepts
translate to different frameworks. Use this as a reference.

## What transfers across all stacks

These concepts are universal — they work regardless of language:

- **AGENTS.md** — entry point for AI agents
- **CHANGES.md** — append-only change log for dead code detection
- **SESSION_SUMMARY.md** — session handoff between agent sessions
- **Three-tier testing** — feature tests, architecture tests, integration tests
- **Health check** — file size limits, total LOC budget
- **Lifecycle hooks** — session start, post-edit, pre-compact, stop
- **Mode system** — full vs lean enforcement levels

## Contributing your stack

If you've adapted the kit to a stack that isn't represented:
1. Add examples to the relevant variant's `docs/stack-choice.md`
2. Add a quick-start example in the AGENTS.md `<details>` section
3. Open a PR — see CONTRIBUTING.md
