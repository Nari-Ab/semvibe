# Semvibe: Benchmark & Go/No-Go Evaluation Protocol (Revised v2)
**Rigorous Pre-Registered Empirical Protocol**
*Date: 2026-10-03*
*Frozen Engine Commit Hash:* `ce461f7`

---

## 1. Pre-Registered Go/No-Go Decision Gates

All criteria below must pass simultaneously to authorize commercial Phase 2 development. A single failure is a stop/pivot signal.

| Gate | Target Metric | Statistical Definition (95% Wilson CI) | Failure Implication |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 85\%$** | Wilson 95% lower bound $\ge 72\%$ on pooled sample ($n \ge 50$ candidate findings) | **Stop/Revise:** Developer trust destroyed by false alarms. |
| **2. Recall (Seeded)** | **$\ge 85\%$ (17/20)** | Injected mutations within Phase 1 scope (Wilson lower bound $\ge 64\%$) | **Stop/Revise:** Core detection engine blind to common AI drift. |
| **3. Prevalence** | **$\ge 1.0$ verified TP per 1,000 LOC** | Observed in at least 2 of 3 held-out repositories | **Stop/Pivot:** Architectural drift is too rare in practice; no viable market. |
| **4. Cost & Speed Moat** | **$\ge 80\%$ token reduction** vs Naive LLM baseline | Measured cost per scan across test corpus | **Stop/Pivot:** If full LLM scanning is as cheap, hybrid engine has no moat. |
| **5. Qualitative Adoption** | **$\ge 3$ of 5 dev interviews confirm utility** | Active Cursor/Claude Code users review findings | **Stop/Pivot:** Findings are technically true but not worth paying for. |

---

## 2. Pinned Repositories (Fixed URLs & Commit SHAs)

To eliminate post-hoc selection bias, the test corpus is fixed before any execution:

### Dev Calibration Set (Used for calibration, never for final scores):
1. **`QIP/frontend`** (Local Next.js 15 App Router, React 19, TypeScript).
2. **`shadcn-ui/taxonomy`** (Next.js 14 App Router, Prisma, Zod, Tailwind) — Commit: `d2b5df8`.

### Held-Out Test Set (FROZEN — evaluated once with zero code tweaks):
3. **Repo A (AI-Vibe Coded Web App):**
   * Repo: `steven-tey/dub` (or slice `dub/apps/web`) — Commit: `3ef4b1a`
   * Characteristics: Fast-evolving full-stack Next.js app with extensive AI assistance and community PRs.
4. **Repo B (Multi-tier Backend Service Layer):**
   * Repo: `calcom/cal.com` (package `packages/trpc` + `packages/features`) — Commit: `7a1e8c2`
   * Characteristics: Clean multi-layer architecture, strict validation contracts, mixed error strategies.
5. **Repo C (AI Boilerplate without .cursorrules):**
   * Repo: `open-webui/open-webui` (frontend client slice) — Commit: `f8a4b3d`
   * Characteristics: Community-driven AI project without central architecture linters.

---

## 3. Scope-Aligned Mutation Suite (20 Seeded Injections)

Mutations are strictly aligned with Phase 1 capabilities (Error Handling, Library Roles, Layer Isolation, and Unencapsulated Calls). Injected into a clean baseline repository (e.g. `shadcn-ui/taxonomy` fixture):

### A. Error Handling Contracts (6 Mutations):
1. Service function throwing raw `new Error("msg")` where `Result<T, E>` is dominant.
2. Service function returning `{ success: false, error: "msg" }` where `Result` is dominant.
3. Controller throwing raw string exception (`throw "Unauthorized"`).
4. Service throwing custom class error where `Result` is dominant.
5. Function returning untyped null on failure in Result-dominant layer.
6. Async function missing error handler in Result-dominant layer.

### B. Library Redundancy & Role Collisions (7 Mutations):
7. Rogue `axios` imported in project standardized on `native-fetch`.
8. Rogue `superagent` call in project standardized on `native-fetch`.
9. Rogue `got` imported in project standardized on `native-fetch`.
10. Rogue `yup` schema declaration in project standardized on `zod`.
11. Rogue `joi` validator in project standardized on `zod`.
12. Rogue `jotai` atom in project standardized on `zustand`.
13. Rogue `mobx` observable in project standardized on `zustand`.

### C. Layer Boundary Inversions (4 Mutations):
14. React component importing database driver (`@prisma/client`) directly.
15. UI component importing server-only database repository.
16. Service layer importing presentation component (`components/Button`).
17. Controller importing raw internal database driver.

### D. Unencapsulated Global Calls (3 Mutations):
18. Rogue global `fetch("https://...")` inside component without using client wrapper.
19. Rogue global `fetch(...)` inside service without tenant headers.
20. Rogue global `fetch(...)` inside utility bypassing configured API client.

$$\text{Recall} = \frac{\text{Detected Injections}}{20}$$

---

## 4. Independent Blind Labeling Protocol

1. **Pooling & Shuffling:** All candidate findings across all 3 held-out test repos are exported into a single CSV without tool confidence scores or tool reasoning.
2. **De-duplication:** If a single rogue file produces 5 identical violations of the same rule, it is collapsed into a single finding unit (1 candidate violation).
3. **Blind Assessment:** An independent reviewer classifies each item into:
   * **`[TP]` True Positive:** Clear violation of the project's established convention that warrants a review comment.
   * **`[FP-Intentional]` False Positive:** Valid intentional exception (e.g. fatal startup assertion, script entrypoint).
   * **`[FP-Noise]` False Positive:** Misparsed syntax, incorrect layer assignment, or dead code.
4. **Precision Calculation:**
   $$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP-Intentional} + \text{FP-Noise}}$$

---

## 5. Comparative Moat Evaluation (4 Parallel Runs)

To evaluate whether Semvibe provides a measurable engineering moat:

* **Run 1: Pure AST Mode (`semvibe scan --ast-only`):**
  * Measures baseline heuristic accuracy without LLM cost.
* **Run 2: Hybrid Semvibe (`semvibe scan`):**
  * Measures precision lift and false-positive elimination via targeted LLM verification.
* **Run 3: `drift-analyzer[typescript]`:**
  * Compares overlap with current state-of-the-art open source deterministic tool.
* **Run 4: Naive Full-Codebase LLM Baseline:**
  * Runs standard Claude 3.5 Sonnet / GPT-4o with prompt: *"Identify architectural inconsistencies in this codebase"* on the entire codebase.
  * Measures: Total token consumption, cost in USD, and latency compared to Semvibe's targeted hybrid scan.
