# Mault Core - AI Coder Guide

> **READ THIS FIRST**: This document helps AI coding assistants (Cursor, Copilot, ChatGPT, Claude) understand and maintain `mault.yaml` — the project's architectural rulebook.

---

## What is Mault?

**Mault automates architectural discipline for AI-assisted development.** It's a VS Code extension that:

1. **Detects** architectural violations in real-time (wrong file locations, deprecated patterns, naming chaos)
2. **Advises** with context-rich prompts explaining why something is wrong and how to fix it
3. **Enforces** project conventions defined in `docs/mault.yaml`

**Why it matters for AI coders**: AI coding tools are fast but lack architectural memory. They write messy code if they see messy code. Mault gives you the rulebook so you can **maintain consistency** across the codebase.

---

## Quick Setup (New Projects)

> **CRITICAL**: The mault.yaml configuration MUST match your actual project structure. Generic templates won't work. You MUST scan the codebase first.

### Step 1: Detect Language

Look for indicator files:

| If you find... | Language | Test Pattern | Function Naming |
|----------------|----------|--------------|-----------------|
| `tsconfig.json`, `*.ts` files | **TypeScript** | `*.test.ts`, `*.spec.ts` | `camelCase` |
| `package.json` (no tsconfig) | **JavaScript** | `*.test.js`, `*.spec.js` | `camelCase` |
| `pyproject.toml`, `requirements.txt`, `setup.py` | **Python** | `test_*.py`, `*_test.py` | `snake_case` |

### Step 2: Map Directory Structure

Run `ls -la` or `tree -L 2` to discover:

```bash
# What is the source directory?
#   src/          ← TypeScript standard
#   lib/          ← Some Node.js projects
#   app/          ← Python Flask/Django
#   <package>/    ← Python with package name
#   (flat)        ← All code in root

# Where are services/business logic?
#   src/services/, lib/services/, app/services/, or none

# Where are utilities?
#   src/utils/, src/helpers/, lib/utils/, common/, or none

# Where are tests?
#   tests/, __tests__/, test/, or colocated (src/**/*.test.ts)
```

### Step 3: Record What You Found

Before writing mault.yaml, note:

- **Source directory**: _______ (e.g., `src`, `lib`, `app`, or root)
- **Services location**: _______ (e.g., `src/services`, or none)
- **Utils location**: _______ (e.g., `src/utils`, `helpers`, or none)
- **Models location**: _______ (e.g., `src/models`, or none)
- **Tests location**: _______ (e.g., `tests`, `__tests__`, or colocated)
- **Config files present**: _______ (e.g., `.gitignore`, `package.json`)

### Step 4: Create docs/mault.yaml

Create the file using the template below, **replacing ALL paths with what you discovered**.

```
your-project/
├── docs/
│   └── mault.yaml    ← CREATE THIS FILE
├── [source-dir]/     ← Whatever you discovered
└── [config-files]
```

---

## TypeScript/JavaScript Template

> **WARNING**: Replace all `src/` paths with YOUR actual source directory.

```yaml
version: 1

environment:
  apiPort: 3000
  shell: "bash"  # or "powershell" for Windows

# Note: conventions.naming is for documentation only (not enforced by detectors)
# Use Detectors.directoryReinforcement.rules for file placement enforcement
conventions:
  naming:
    - filePattern: "*.ts"
      className: "PascalCase"
      functionName: "camelCase"
      constantName: "SCREAMING_SNAKE_CASE"

deprecatedPatterns:
  - id: dep-moment
    import: moment
    message: "Use date-fns or dayjs instead of moment."
    languages: [typescript, javascript]

  - id: dep-request
    import: request
    message: "Use axios or node-fetch instead of request."
    languages: [typescript, javascript]

  # Add project-specific deprecated patterns here

Detectors:
  environmentReinforcement:
    enabled: true
    checkPaths: true
    checkCommands: true

  directoryReinforcement:
    enabled: true
    rules:
      # ⚠️ CUSTOMIZE THESE PATHS for your project structure
      - pattern: "**/*Service.ts"
        expectedDir: "src/services"    # ← REPLACE with your services location
        reason: "Service files should be in src/services/"

      - pattern: "**/*Util*.ts"
        expectedDir: "src/utils"       # ← REPLACE with your utils location
        reason: "Utility files should be in src/utils/"

      - pattern: "**/*Helper*.ts"
        expectedDir: "src/utils"       # ← REPLACE with your utils location
        reason: "Helper files should be in src/utils/"

      - pattern: "**/*.test.ts"
        expectedDir: "tests"           # ← REPLACE with your tests location
        reason: "Test files should be in tests/"

  flatArchitecture:
    enabled: true
    targets:
      - path: "src"                    # ← REPLACE with your source directory
        maxRootFiles: 10
        minSubdirs: 3
        excludePatterns: ["dist/**", "node_modules/**"]

  configChaos:
    enabled: true
    requiredConfigs:
      - ".gitignore"
      - "package.json"
      - "tsconfig.json"

  tempFiles:
    enabled: true
    patterns:
      - "**/*.tmp"
      - "**/temp_*"
      - "**/scratch_*"
      - "**/*.bak"
      - "**/debug_*"

  fileProliferation:
    enabled: true
    threshold: 3

  overcrowdedFolders:
    enabled: true
    targets:
      - path: "src"                    # ← REPLACE with your source directory
        maxFiles: 20
      - path: "src/utils"              # ← REPLACE with your utils location
        maxFiles: 15
```

---

## Python Template

> **WARNING**: Python projects vary widely. Replace ALL paths with your actual structure.

```yaml
version: 1

environment:
  apiPort: 8000
  shell: "bash"  # or "powershell" for Windows

# Note: conventions.naming is for documentation only (not enforced by detectors)
# Use Detectors.directoryReinforcement.rules for file placement enforcement
conventions:
  naming:
    - filePattern: "*.py"
      className: "PascalCase"
      functionName: "snake_case"
      variableName: "snake_case"
      constantName: "SCREAMING_SNAKE_CASE"

deprecatedPatterns:
  - id: dep-optparse
    import: optparse
    message: "Use argparse instead of optparse."
    languages: [python]

  - id: dep-urllib2
    import: urllib2
    message: "Use urllib.request instead (Python 3)."
    languages: [python]

  - id: dep-imp
    import: imp
    message: "Use importlib instead of imp."
    languages: [python]

  # Add project-specific deprecated patterns here

Detectors:
  environmentReinforcement:
    enabled: true
    checkPaths: true
    checkCommands: true

  directoryReinforcement:
    enabled: true
    rules:
      # ⚠️ CUSTOMIZE THESE PATHS for your project structure
      - pattern: "**/*_service.py"
        expectedDir: "app/services"    # ← REPLACE: could be src/, app/, or package name
        reason: "Service files should be in app/services/"

      - pattern: "**/*_util*.py"
        expectedDir: "app/utils"       # ← REPLACE with your utils location
        reason: "Utility files should be in app/utils/"

      - pattern: "**/test_*.py"
        expectedDir: "tests"           # ← REPLACE with your tests location
        reason: "Test files should be in tests/"

  flatArchitecture:
    enabled: true
    targets:
      - path: "."                      # Python often uses root, not src/
        maxRootFiles: 15
        minSubdirs: 2
        excludePatterns: ["venv/**", ".venv/**", "__pycache__/**", ".git/**"]

  configChaos:
    enabled: true
    requiredConfigs:
      - ".gitignore"
      - "requirements.txt"
    optionalConfigs:
      - "pyproject.toml"
      - "setup.py"

  tempFiles:
    enabled: true
    patterns:
      - "**/*.tmp"
      - "**/temp_*"
      - "**/scratch_*"
      - "**/*.bak"
      - "**/debug_*"
      - "**/.ipynb_checkpoints/**"

  fileProliferation:
    enabled: true
    threshold: 3

  overcrowdedFolders:
    enabled: true
    targets:
      - path: "app"                    # ← REPLACE with your source directory
        maxFiles: 20
```

---

## If a Directory Doesn't Exist

If your project has no `services/` folder, you have two choices:

1. **Skip the rule** — Don't include `directoryReinforcement` rules for it
2. **Establish the convention** — Keep the rule to guide future file placement

---

## After Setup

Once `docs/mault.yaml` exists:

1. **Reload VS Code** to activate Mault's detectors
2. **Problems Panel** shows any violations (`Ctrl+Shift+M` / `Cmd+Shift+M`)
3. **Quick Fix** (`Ctrl+.` / `Cmd+.`) offers remediation options

---

## When to Update mault.yaml

Update the rulebook when you:

| Action | Update Section |
|--------|----------------|
| Create a new directory structure | `Detectors.directoryReinforcement.rules` |
| Establish a naming convention | `conventions.naming` (documentation only) |
| Deprecate an old library/pattern | `deprecatedPatterns` |
| Create a new business flow | `applicationFlows` |
| Add required configuration files | `Detectors.configChaos.requiredConfigs` |

### Example: Adding a New Directory Rule

If you create a new `src/adapters/` directory for external API adapters:

```yaml
Detectors:
  directoryReinforcement:
    rules:
      # ... existing rules ...
      - pattern: "**/*Adapter.ts"
        expectedDir: "src/adapters"
        reason: "Adapter files should be in src/adapters/"
```

### Example: Deprecating a Pattern

If you're migrating from `axios` to `fetch`:

```yaml
deprecatedPatterns:
  - id: axios-deprecated
    import: axios
    message: "Use native fetch API. See docs/migration/axios-to-fetch.md"
    languages: [typescript, javascript]
```

---

## Built-in Detectors (No Config Required)

These detectors work automatically without mault.yaml:

| UC | Detector | What It Catches |
|----|----------|-----------------|
| UC10 | Naming Chaos | Inconsistent naming in same folder (detects dominant pattern) |
| UC16 | Dependency Health | Vulnerable npm/pip packages |
| UC17 | Architecture Diagrams | Visualizes dependencies (Pro) |

---

## Config-Dependent Detectors

These require mault.yaml configuration:

| UC | Detector | Config Section | Notes |
|----|----------|----------------|-------|
| UC01 | Directory Reinforcement | `Detectors.directoryReinforcement.rules` | Primary file placement enforcement |
| UC02 | Legacy Path Prevention | `deprecatedPatterns` | Deprecated import detection |
| UC03 | Convention Reinforcement | `conventions.naming` | Documentation only (not enforced) |
| UC04 | Environment Reinforcement | `Detectors.environmentReinforcement` | OS-specific code detection |
| UC06 | Temporary Files | `Detectors.tempFiles.patterns` | Temp file detection |
| UC07 | Flat Architecture | `Detectors.flatArchitecture.targets` | Root file limits |
| UC08 | Configuration Chaos | `Detectors.configChaos.requiredConfigs` | Missing config detection |
| UC09 | File Proliferation | `Detectors.fileProliferation` | Duplicate file detection |
| UC11 | Overcrowded Folders | `Detectors.overcrowdedFolders.targets` | Folder size limits |
| UC12 | Scattered Utils | `Detectors.scatteredUtils` | Utility centralization (built-in) |
| UC13 | Application Flows | `applicationFlows`, `flows` | Flow mapping |
| UC18 | Structural Governance (Pro) | `rules` | AST-based enforcement |

> **Important**: `conventions.directories` is NOT used. Use `Detectors.directoryReinforcement.rules` for file placement rules.

---

## Available Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

### Setup & Configuration
| Command | Description |
|---------|-------------|
| `Mault: Initialize` | Initialize Mault in the workspace |
| `Mault: Open AI Coder Guide` | Open this setup guide |
| `Mault: Audit Configuration` | Check mault.yaml validity |
| `Mault: Set Detection Level` | Adjust diagnostic sensitivity |

### AI Prompt Generation
| Command | Description |
|---------|-------------|
| `Mault: Copy findings report (JSON)` | Full JSON report of all issues |
| `Mault: Copy remediation prompt` | AI-optimized prompt for specific issue |
| `Mault: Copy naming convention fix prompt` | Naming violation fix prompt |

### File Operations
| Command | Description |
|---------|-------------|
| `Mault: Move file to expected location` | Quick Fix in Problems panel |
| `Mault: Archive temporary files` | Move temp files to archive |
| `Mault: Quick rename file` | Single file rename |
| `Mault: Batch rename all files` | Batch rename |

---

## Best Practices

### 1. Scan Before Writing
Always run `ls -la` or `tree -L 2` before creating mault.yaml. Never assume `src/` exists.

### 2. Replace ALL Template Paths
Every `src/services`, `src/utils`, `tests/` in the template must be replaced with your actual paths.

### 3. Update Rules When Creating Patterns
When you establish a new pattern (e.g., "all adapters go in `src/adapters/`"), add it to mault.yaml.

### 4. Check Diagnostics After Changes
Run `Mault: Show Findings Summary` to see if your changes introduced violations.

---

## File Locations

| Purpose | Path |
|---------|------|
| Project rulebook | `docs/mault.yaml` |
| Extension logs | `.memory-layer/logs/` |
| Cached rules | `.memory-layer/cache/` |
| Exported reports | `.memory-layer/reports/` |
| Archived files | `.memory-layer/archive/` |

---

## Complete Reference

For complete templates with all UC configurations (UC01-UC18), see:
**`docs/guides/mault-golden.md`**

---

**Remember**: Mault is your architectural memory. The configuration MUST match your actual project structure — scan first, then customize.
