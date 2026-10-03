# Semvibe: Commercial Architectural Integrity Platform for the AI Vibe-Coding Era
**Specification & Architectural Design**
*Date: 2026-10-03*
*Status: Approved for Planning*

---

## 1. Executive Summary & Vision

### 1.1 The Problem
In 2026, AI coding assistants (Cursor, Claude Code, GitHub Copilot, Windsurf) have made code generation orders of magnitude faster. However, AI agents operate with **local context windows**: they optimize for passing the current prompt or single test, but possess zero awareness of global repository architecture.

This causes rapid **Architectural Drift & Erosion**:
1. **Redundant Implementations:** Multiple slightly different HTTP clients, formatting helpers, and cache layers created by different prompts.
2. **Layering Inversion:** UI components querying databases directly, business logic leaking into presentation controllers.
3. **Convention Fragmentation:** Mixing disparate error-handling schemas (`Result<T, E>` vs `throw new Error` vs `{ success: false }`), state libraries, and validation patterns in the same codebase.
4. **Agent Amnesia:** Every new AI prompt starts from scratch, repeating anti-patterns.

### 1.2 The Solution
**Semvibe** is the **Architectural Guardrail & Intelligence Engine for AI-assisted engineering**.
Unlike legacy tools that require tedious manual configuration files (`architecture.yml`), Semvibe automatically discovers the codebase's latent architectural invariants via AST clustering and enforces them using a **hybrid AST + Semantic AI engine**.

### 1.3 The Core Moat
* **Zero-Config Discovery (`semvibe learn`):** Automatically extracts 90%+ architectural invariants from existing code without manual setup.
* **Hybrid Two-Phase Pipeline:** Fast AST extraction (0 tokens, millisecond execution) + targeted LLM semantic validation only on statistical outliers (90% cost savings compared to brute-force LLM scanning).
* **Agent-First Native MCP (`semvibe mcp`):** Directly embeds into Claude Code, Cursor, and Windsurf, feeding architecture constraints into agents *before* they generate code.
* **Autonomous Remediation (`semvibe fix`):** Generates unified diffs and PRs that automatically align deviant code to the project's standard pattern.

---

## 2. Market Analysis, Competitors & Commercialization

### 2.1 Competitive Landscape
| Feature / Metric | Drift (`drift-analyzer`) | SonarQube / Snyk | Revieko / GyroCompass | **Semvibe** |
| :--- | :--- | :--- | :--- | :--- |
| **Engine** | Deterministic AST (22 rules) | Static AST / Security | Git baseline / Yaml rules | **Hybrid: AST + Semantic LLM** |
| **Semantic Understanding** | ❌ None (blind to intent) | ❌ None | ⚠️ Minimal | ✅ **Full semantic intent analysis** |
| **Configuration Friction** | Manual config | Complex enterprise setup | Requires manual `architecture.yml` | ✅ **Zero-Config (`semvibe learn`)** |
| **AI Agent MCP Integration** | Basic CLI only | ❌ None | ❌ None | ✅ **Native MCP Server (`semvibe mcp`)** |
| **Auto-Fix Capabilities** | ❌ Manual rewrite | ❌ Static suggestions | ❌ Warning only | ✅ **`semvibe fix` (AI Auto-Align)** |
| **Multi-Provider Support** | N/A (no AI) | Proprietary / None | Fixed cloud API | ✅ **OmniRoute, Ollama, BYOK** |

### 2.2 Monetization Tiers
* **Community / OSS (Free):** Local CLI scanner, BYOK (OpenAI, Anthropic) or local Ollama / OmniRoute, terminal reports. Drives top-of-funnel developer adoption.
* **Pro Tier ($19 / dev / month):**
  * `semvibe fix` autonomous refactoring patches.
  * `semvibe mcp` for Cursor / Claude Code IDE integration.
  * Local cross-commit trend tracking & caching.
* **Team & Enterprise ($49 / seat / month):**
  * GitHub App / GitLab CI automated PR reviews & blocking gates.
  * Centralized architectural invariant synchronization across team repositories.
  * Architectural Health & Technical Debt Scorecard for Engineering Leads and CTOs.

---

## 3. System Architecture & Component Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User & Agent Entrypoints                        │
│   CLI (`semvibe scan|learn|fix`)  │  MCP Server  │  GitHub Action CI   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Core Pipeline Engine                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 1. AST Structural Extractor (`@semvibe/core/extractor`)        │   │
│   │    - Import dependency graph & circular reference detection    │   │
│   │    - Layer boundary mapping (UI -> Domain -> Infrastructure)   │   │
│   │    - Function signature, return type & error pattern matrix    │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ AST Signatures                     │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 2. Invariant Discovery & Clustering (`@semvibe/core/invariants`)│  │
│   │    - Statistical pattern clustering (e.g. 95% use Result<T,E>) │   │
│   │    - Outlier identification (deviations from dominant pattern) │   │
│   │    - Baseline invariant persistence (`.semvibe/invariants.json`)│  │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Suspect Outliers + Invariants      │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 3. Semantic Verification Engine (`@semvibe/llm`)               │   │
│   │    - Verified prompt construction with exemplary code snippets │   │
│   │    - Multi-provider router: OmniRoute (fallback) / Ollama / API│   │
│   │    - Structured JSON verdict (False positive vs True violation)│   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Clean Violations                   │
│                                   ▼                                    │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 4. Action & Remediation Engine (`@semvibe/remediation`)        │   │
│   │    - Unified Diff generator (`semvibe fix`)                    │   │
│   │    - Interactive CLI terminal reporting (Chalk / Tables)       │   │
│   │    - SARIF / GitHub PR Check Annotations                       │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Component Specifications

### 4.1 `@semvibe/core`
* **File Scanner & Ignore Filter:** Scans project files respecting `.gitignore` and default exclusions (`node_modules`, `dist`, `.git`).
* **AST Extractor (`extractor.ts`):** Parses TypeScript/JavaScript files into AST nodes using TypeScript Compiler API:
  * Extract imports (external package vs internal layer relative import).
  * Extract exports (classes, functions, interfaces, types).
  * Extract call patterns (error throwing, HTTP client invocations, DB queries).
* **Invariant Learner (`invariants.ts`):** Computes architectural norms:
  * Layer access rules: e.g. `src/components/*` must never import `src/db/*`.
  * Return conventions: e.g. `src/services/*` always return `Promise<Result<...>>`.
  * External library norms: e.g. single state manager (`zustand`), single validator (`zod`).

### 4.2 `@semvibe/llm`
* **Router & Provider Adapter:**
  * Primary: Local OmniRoute (`http://localhost:20128/v1`) with fallback.
  * Direct Anthropic API (`claude-3-5-haiku` / `claude-3-7-sonnet`).
  * Direct Ollama (`qwen2.5-coder` / `llama3.3`).
* **Verification Prompts:** Structured JSON output schema enforcing strict schema validation (title, description, severity, deviant_code, standard_pattern, remediation_patch).

### 4.3 `@semvibe/mcp`
* **MCP Protocol Tools:**
  * `semvibe_get_architecture_rules`: Returns active architectural invariants for the project so agents know constraints before writing code.
  * `semvibe_validate_code`: Validates proposed code snippet or file against architecture rules before commit.
  * `semvibe_suggest_fix`: Returns recommended refactoring diff for an existing violation.

### 4.4 `@semvibe/remediation`
* **`semvibe fix` command:**
  * Takes violation coordinates.
  * Prompts LLM to rewrite deviant segment strictly adhering to the dominant baseline pattern.
  * Applies diff or produces `.patch` file with interactive confirmation.

---

## 5. Implementation Roadmap (Phases)

* **Phase 1: Hybrid Core Engine:** TypeScript AST extractor for imports, layers, and error patterns + statistical outlier detection.
* **Phase 2: Universal LLM Router Integration:** Connect to OmniRoute (auto-fallback across 300+ models) and direct providers.
* **Phase 3: CLI Command Suite:** `semvibe scan`, `semvibe learn`, `semvibe init`, and rich terminal reports.
* **Phase 4: Agent Guardrail MCP Server:** `semvibe mcp` exposing tools for Cursor and Claude Code.
* **Phase 5: Auto-Fix Engine:** `semvibe fix` generating git patches.
* **Phase 6: CI/CD & SARIF Integration:** GitHub Action configuration and PR reporter.

---

## 6. Verification & Quality Gates

* **Unit & AST Tests:** Ensure 100% accurate extraction of imports, layer boundaries, and AST symbols without syntax errors.
* **Token Efficiency Benchmark:** Measure token usage compared to naive full-codebase LLM scan (target: >85% token reduction via AST filtering).
* **Accuracy Test Suite:** Synthetic test repos with intentional architectural flaws (layer violations, duplicate HTTP clients, mixed error patterns) ensuring >95% recall and zero false positives.
