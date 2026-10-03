# Semvibe: Semantic Inconsistency & Architectural Integrity Platform
**Product Specification & Technical Architecture (Revised)**
*Date: 2026-10-03*
*Status: Approved for Planning (Phase 1 Lean MVP)*

---

## 1. Executive Summary & Problem Space

### 1.1 The Problem in the AI Vibe-Coding Era
AI coding assistants (Cursor, Claude Code, GitHub Copilot, Windsurf) have made local code generation orders of magnitude faster. However, AI agents operate within **local context windows**: they optimize for passing the immediate prompt or test, without understanding the repository's broader architectural conventions.

This causes rapid **Architectural Drift & Semantic Inconsistency**:
1. **Redundant Implementations:** Multiple slightly different HTTP clients, formatting helpers, or caching wrappers generated across different prompts.
2. **Layering Inversion:** UI components querying databases directly or controllers bypassing service layers.
3. **Convention Fragmentation:** Mixing disparate error-handling schemas (`Result<T, E>` vs `throw new Error` vs `{ success: false }`), state libraries, and validation patterns in the same codebase.
4. **Agent Amnesia:** Every new AI prompt starts without architectural guardrails, repeating anti-patterns.

### 1.2 The Solution & Moat: Semantic Outlier Detection
**Semvibe** is a **semantic inconsistency detector** built specifically for TypeScript/JavaScript codebases.
Unlike generic AI code reviewers or rigid static linters:
* **Zero-Config Discovery (`semvibe learn`):** Automatically extracts statistically dominant architectural patterns across the repository (e.g. "93% of services return `Result<T, E>`", "100% of DB calls go through repositories").
* **Candidate Invariant Verification:** Presents discovered patterns to the developer as *candidate invariants* with human confirmation, avoiding false alarms during migrations.
* **Hybrid AST + Targeted LLM Engine:** Uses fast, zero-token AST analysis to filter the codebase and cluster patterns, sending only statistical anomalies to the LLM for deep semantic verification.
* **Instant Prevention via Rules Export (`semvibe export-rules`):** Compiles verified invariants into `.cursorrules`, `CLAUDE.md`, and `.windsurfrules` with zero friction—giving AI agents architectural guardrails *before* code is generated, without requiring a running daemon.

---

## 2. Market Analysis & Realistic Competitor Positioning

| Tool | Core Technology | Primary Focus & Languages | Strengths | Limitations / Gaps Semvibe Solves |
| :--- | :--- | :--- | :--- | :--- |
| **Drift (`drift-analyzer`)** | Deterministic AST (22 rules, local SQLite, MCP server, `fix-plan`) | Multi-language (Python, Go, Rust, TS experimental) | Fast, local, no API keys needed, zero-config run | Lacks deep semantic intent analysis; rules are deterministic heuristics; TS support is secondary. |
| **Greptile** | Full-repo semantic indexing + PR review bot | Multi-language B2B | Excellent at catching missing shared middleware / auth in PRs | Heavy SaaS product; focused on PR code review rather than local developer workflow and invariant extraction. |
| **SonarQube / Snyk** | Static AST + CVE databases | Enterprise multi-language | Deep security vulnerability analysis, code coverage | Blind to AI-generation quirks, library redundancy, and semantic architectural drift. |
| **Semvibe (Ours)** | **Hybrid:** AST Feature Extractor + Statistical Clustering + Targeted LLM Verification | **TypeScript / JavaScript first** (Node, React, Next.js, Express) | Automatic invariant discovery, zero-config `.cursorrules` export, low token cost, high precision on TS conventions. | Dedicated focus on semantic consistency and agent alignment in the modern TS/JS ecosystem. |

---

## 3. Critical Technical Design Decisions

### 3.1 Resolving the "Dominant Pattern ≠ Truth" Problem (Migrations & Fragmentation)
1. **Candidate Invariants + Human Confirmation:**
   When running `semvibe learn`, the engine does not unilaterally declare dominant patterns as immutable laws. It outputs candidate invariants with confidence scores:
   ```
   Found 2 candidate invariants:
   [1] Error Handling: 88% of services return Result<T, AppError> (12% throw raw Error)
   [2] HTTP Client: 100% of API calls use lib/api-client (0% use native fetch)
   Save to .semvibe/invariants.json? [Y/n/edit]
   ```
2. **Freshness Bias (Git Recency Weighting):**
   Code modified in the last 30 days is weighted higher during clustering. If a team is migrating from `throw` to `Result`, recent files will be recognized as the emerging target standard.
3. **Handling High Fragmentation (e.g. 40% / 35% / 25% split):**
   If no single pattern exceeds the dominance threshold (default: 75%), Semvibe does **not** invent false outliers. Instead, it flags an **"Unresolved Style Divergence"** report, notifying the developer that the codebase is split and needs an architectural decision.

### 3.2 Target Quality & Evaluation Benchmark
* **Primary Metric:** **Precision > 80%** (Low false-positive rate is mandatory for developer trust).
* **Validation Benchmark:**
  * 5 real open-source TypeScript repositories (varying from strict clean architecture to heavily AI-generated apps).
  * 50 manually labeled architectural findings (real violations vs intentional exceptions).
* **Go / No-Go Gate for Phase 2:**
  Before building SaaS, GitHub Bots, or Enterprise features, the Phase 1 CLI must achieve:
  1. Precision ≥ 80% on the benchmark.
  2. At least 3 genuine architectural inconsistencies caught that deterministic tools (ESLint / Drift) missed.
  3. Positive feedback from 3–5 active AI vibe-coders (Cursor/Claude Code users).

---

## 4. Phase 1 Lean MVP Scope (1–2 Weeks Execution)

### Included in Phase 1:
1. **`@semvibe/core` (AST Extractor & Classifier):**
   * Uses TypeScript Compiler API (`ts-morph` or `@babel/parser` / `@typescript-eslint`).
   * Extracts:
     - **Import & Layer Matrix:** which directory imports which.
     - **Error Handling Signatures:** `throw`, `return Result`, `return { error }`, `try/catch`.
     - **Library Redundancy:** detecting duplicate dependencies for the same role (e.g. Axios + fetch, Zod + Yup, Zustand + Redux).
2. **`@semvibe/invariants` (Statistical Clustering):**
   * Computes pattern distribution and flags outliers (threshold > 75% dominance).
   * Generates candidate `.semvibe/invariants.json`.
3. **`@semvibe/llm` (Targeted Semantic Verifier):**
   * Verifies only statistical outliers using configurable LLM (Anthropic API / local Ollama / OpenAI-compatible endpoint).
   * Verifies whether the outlier is a genuine semantic bug/drift or an acceptable special case.
4. **`@semvibe/cli`:**
   * `semvibe learn`: Scans project, displays candidate invariants, saves config.
   * `semvibe scan`: Scans for deviations, outputs rich terminal report.
   * `semvibe export-rules`: Generates/updates `.cursorrules`, `CLAUDE.md`, and `.windsurfrules`.

### Deferred to Phase 2+ (Post-Validation):
* ⏸ Full Native MCP Server daemon (replaced in Phase 1 by instantaneous `export-rules`).
* ⏸ Autonomous `semvibe fix` git patcher (developer's existing agent can fix code once pointed to the invariant).
* ⏸ GitHub Action PR bot & SARIF reports.
* ⏸ Web Dashboard, Cloud Sync & Team SaaS tiers.

---

## 5. Commercial Model (Hypotheses)

* **Open-Source Core CLI (Free):** Local scanning, candidate invariant discovery, rules export. Top-of-funnel viral acquisition.
* **Pro Tier ($19 / dev / month — hypothesis):** Deep cross-repo semantic caching, automated remediation diffs.
* **Team / Enterprise ($49 / seat / month — hypothesis):** Centralized team invariant enforcement, CI/CD PR blocking gates, compliance reports.
