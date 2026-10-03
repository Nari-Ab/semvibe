# Semvibe: Core Engine Benchmark & Go/No-Go Evaluation Protocol (v6 Deterministic Baseline)
**Pre-Registered Empirical Testing Standard for Statistical Invariant Discovery & AST Drift Detection**
*Date: 2026-10-03*
*Engine Frozen Commit:* `ce461f7` (Git tag: `benchmark-v6-core`, verified `git diff ce461f7 HEAD -- src/` is empty)
*Execution Mode:* 100% Deterministic (AST Parsing + Statistical Invariant Discovery, Zero External LLM Calls, Zero Cost)
*Sampling Seed:* `42`

---

## 1. Executive Context & Scope of Phase 1 Evaluation

### 1.1 Shift in Product Thesis & Experimental Objective
In Phase 1, Semvibe is evaluated strictly on its foundational engineering innovation: **automatic statistical invariant discovery and fast structural outlier detection directly on TypeScript AST**.
* **Zero External Network / Zero Cost:** Semvibe runs entirely on the developer's machine in milliseconds without sending source code to third-party APIs.
* **L1 vs L2 Separation:** 
  * **Layer 1 (Core Deterministic Engine):** AST extraction, statistical dominance calculation ($\ge 75\%$, $N \ge 5$), and automated rules generation (`AGENTS.md`, `CLAUDE.md`).
  * **Layer 2 (Semantic LLM Filter):** Deferred to Phase 2. To prevent post-hoc data leakage, when L2 is evaluated in the future, it will be benchmarked strictly against the Tier 2 Reserve Repositories (`payloadcms/payload` and `directus/directus`), using the baseline established here as the ablation benchmark.
* **Meaning of "GO":** A "GO" verdict in Phase 1 confirms that **the deterministic core engine is empirically viable as a foundation**, establishing the exact quantitative baseline for Phase 2. Because pure AST mode lacks semantic exception filtering, an expected false positive rate of ~25–30% represents natural syntactic noise (e.g. startup panics or test mocks). The benchmark explicitly reports against **both** the v6 baseline ($72\%$ point / $58\%$ lower bound) and the commercial production target ($85\%$ point / $72\%$ lower bound) to quantify the exact gap that the Phase 2 L2 semantic filter must bridge.

---

## 2. Pre-Registered Decision Rules (Mandatory Simultaneous Gates)

> **CRITICAL RULE:** For a **"GO"** decision to Phase 2 commercial development, **ALL 5 GATES MUST PASS SIMULTANEOUSLY**. Failure of any single gate triggers an immediate **STOP / PIVOT** review.

| Gate | Target Metric | Statistical Formulation & Pass Condition | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 72\%$ ($k \ge 36/50$)** | **Primary Rule: Wilson 95% CI lower bound $\ge 58\%$** on pooled Run 1 (AST Core) findings ($n \ge 50$, up to 30 sampled per repo per tool). At $n = 50$, satisfying the $58\%$ lower bound strictly requires $k \ge 36/50$ ($72.0\%$). Both v6 baseline and commercial targets ($85\% / 72\%$) are published in the evaluation matrix. | **Stop / Revise Engine:** Excessive noise destroys developer adoption. |
| **2. Seeded Recall** | **$\ge 85\%$ ($17/20$)** | Evaluated on pure deterministic AST mode. Detected single-injected mutations matching exact file, line $\pm 5$, and rule category. | **Stop / Revise Engine:** Engine blind to core architectural drift. |
| **3. Real-world Prevalence** | **$\ge 3$ verified TPs per repo** | Observed in at least 2 of 3 held-out repositories. Disambiguated by procedure-based exhaustive audit: if tool finds $< 3$ but audit confirms $\ge 3$ violations, action is **Revise** (Recall gap); if exhaustive 3-convention audit confirms $< 3$ violations across the designated slice, action is **Pivot-Review with Expanded Audit** (evaluating layer boundaries and state managers before initiating Pivot). | **Stop / Revise or Pivot-Review:** Decoupled by exhaustive audit. |
| **4. Competitive Moat** | **$\ge 3$ Unique TPs vs Drift** | Verified TPs caught by Semvibe that are **completely missed** by `drift-analyzer[typescript]==2.51.1` across the held-out repositories. Pooled review across Run 1 and Run 2. | **Stop / Pivot:** No technical differentiation over existing static analyzers. |
| **5. Qualitative Utility** | **$\ge 3$ of 5 dev interviews confirm value** | Outside developers (non-colleagues) confirm findings on their repos warrant fixing in CI. | **Stop / Pivot:** Findings are technically true but developers don't care. |

---

## 3. Pinned Repositories (Verified URLs, Real Git SHAs & Scanned Slices)

All commit SHAs and scanned slices are strictly pre-registered to prevent post-hoc selection:

### Dev Calibration Set (2 Repositories — used for AST pattern calibration, never for scoring):
1. **`AGGIB/QIP` (Frontend Slice)**
   * Commit SHA: `6a81c547c1ec3ba834231881d403d25ee12c15ca`
   * Scanned Slice: `frontend/src`
   * Characteristics: Local Next.js 15 App Router, React 19, TypeScript with explicit `AGENTS.md`.
2. **`shadcn-ui/taxonomy`**
   * Commit SHA: `298a8857c7128a0d121e7f699dfd729f23b3966d`
   * Scanned Slice: `app/`, `components/`, `lib/`
   * Characteristics: Next.js 14 App Router, Prisma, Zod, Tailwind.

### Primary Held-Out Test Set (3 Repositories — FROZEN, single execution):
3. **Repo A (Fast-Paced Next.js Web Application):**
   * Repo: `dubinc/dub`
   * Scanned Slice: `apps/web`
   * URL: `https://github.com/dubinc/dub.git`
   * Verified SHA: `6b2d17fd827d058ff9f5709630677260740055da`
4. **Repo B (Multi-tier Backend Service Layer):**
   * Repo: `calcom/cal.com`
   * Scanned Slice: `packages/trpc` + `packages/features`
   * URL: `https://github.com/calcom/cal.com.git`
   * Verified SHA: `54343aa685ae8f33159d2f485ec4a57bad5c574a`
5. **Repo C (Modern SaaS Starter):**
   * Repo: `leerob/next-saas-starter`
   * Scanned Slice: Entire repository (`app/`, `lib/`, `components/`)
   * URL: `https://github.com/leerob/next-saas-starter.git`
   * Verified SHA: `6e33e58b1e553a41fe22e6b941a7229a002de361`

### Tier 1: Sample Expansion Repositories (Activated ONLY if primary held-out yields $n < 50$ findings):
* **Expansion 1:** `t3-oss/create-t3-app`
  * Scanned Slice: `cli/src` *(Methodological Note: CLI installer codebase, distinct from web app architectures)*
  * Verified SHA: `4709861f7e67a15564c0460c13e7b4b6cfcae40d`
* **Expansion 2:** `steven-tey/precedent`
  * Scanned Slice: `app/`, `components/`, `lib/`
  * Verified SHA: `3be40205d7cdf56082cd284f07f12251b9208f79`

### Tier 2: Post-Revision Reserve Repositories (Held in strict reserve for Phase 2 L2 Semantic Filter Ablation):
* **Reserve 1:** `payloadcms/payload`
  * Scanned Slice: `packages/payload/src`
  * Verified SHA: `15d051b5613d79293f607eab4b1a7e535b75b138`
* **Reserve 2:** `directus/directus`
  * Scanned Slice: `api/src`
  * Verified SHA: `f5be756db0d01c435ab683663c1c896c4d30db67`

---

## 4. Robust Baseline Repository & Complete Mutation Suite (20 Seeded Injections)

### 4.1 Robust Baseline Repository (`tests/benchmark/baseline-repo/`)
To eliminate statistical edge-effects, the baseline repo contains **10–12 files per convention**:
* 10 service files returning `Result<T, AppError>` (100% dominance).
* 10 controller files in `src/controllers/` routing to services (100% dominance).
* 8 API route files using `native-fetch` (100% dominance).
* 8 schema files using `zod` (100% dominance).
* 6 state stores using `zustand` (100% dominance).
* Strict layer separation: Controllers import services; services do NOT import controllers or UI; UI does NOT import DB.

**Two-Stage Negative Control Check:**
1. Running `semvibe learn` on the un-mutated baseline MUST discover all 5 invariants with $\ge 80\%$ confidence.
2. Running `semvibe scan --ast-only` on the un-mutated baseline MUST yield **exactly 0 violations**.

### 4.2 Independent Mutation Generation & Injection Protocol
* Mutations are authored by an independent script without access to Semvibe's source code or `PACKAGE_ROLES` dictionary.
* **Isolated Single-Injection Testing:** Each mutation is tested against an independent copy of the baseline repository (one mutation per copy). This prevents 20 simultaneous mutations from artificially breaking the baseline's 75% dominance threshold.

### 4.3 The 20 Mutation Classes (Strictly Phase 1 Aligned):
* **A. Error Handling Contracts (6 Mutations):**
  1. Service function throwing raw `new Error("msg")` where `Result<T, E>` is dominant.
  2. Service function returning `{ success: false, error: "msg" }` where `Result` is dominant.
  3. Service function returning `{ error: "failed" }` where `Result` is dominant.
  4. Service function throwing raw string (`throw "unauthorized"`).
  5. Controller method throwing untyped custom exception.
  6. Service method returning `undefined` silently on error.
* **B. Library Redundancy & Role Collisions (7 Mutations):**
  7. Rogue `axios` imported in service.
  8. Rogue `got` imported in service.
  9. Rogue `superagent` imported in service.
  10. Rogue `yup` schema declaration in validation module.
  11. Rogue `joi` validator in validation module.
  12. Rogue `jotai` atom in store module.
  13. Rogue `mobx` observable in store module.
* **C. Layer Boundary Inversions (4 Mutations):**
  14. UI Component importing `@prisma/client` directly.
  15. UI Component importing server-only database repository.
  16. Service layer importing presentation component (`components/Button`).
  17. Controller directly executing low-level raw SQL driver.
* **D. Unencapsulated Global Calls (3 Mutations):**
  18. Raw global `fetch()` call inside UI component bypassing client wrapper.
  19. Raw global `fetch()` call in service without error handling.
  20. Raw global `fetch()` call in utility without project headers.

### 4.4 Criteria for Counting a Seeded Mutation as "Detected":
Evaluated on **Run 1: Pure AST Engine**. A seeded mutation is counted as detected ($+1$ to Recall) IF AND ONLY IF:
1. **Target File Match:** The finding's `filePath` corresponds exactly to the mutated file.
2. **Line Range Match:** The reported line number falls within $\pm 5$ lines of the mutated injection.
3. **Category Match:** The reported rule type matches the mutation category.

$$\text{Recall} = \frac{\text{Detected Injections}}{20} \quad (\text{Target} \ge 85\%)$$

---

## 5. Comparative Evaluation Matrix & Execution Protocol

Two deterministic runs are executed on the same held-out test set:

1. **Run 1: Semvibe Core Engine (`semvibe scan --ast-only`)**
   * Mode: Pure deterministic TypeScript AST extraction + statistical invariant discovery.
   * Runtime: Node.js >= 20. Execution outputs saved to `benchmark/raw_runs/semvibe_ast_*.json`.
2. **Run 2: Drift Analyzer Baseline (`drift-analyzer[typescript]==2.51.1`)**
   * Version: Exact pinned release `2.51.1` installed in isolated `.venv` via `pip install "drift-analyzer[typescript]==2.51.1"`.
   * Execution outputs saved to `benchmark/raw_runs/drift_*.json`.

### Rule for "Unique TP vs Drift" (Gate 4):
A finding is classified as a **Unique TP vs Drift** if:
* It is confirmed as `[TP]` by human review.
* Drift reported no violation on the same file and proximate lines ($\pm 10$ lines) within the same category.
* All findings from Runs 1 and 2 are exported to a single unified CSV for review.

---

## 6. Labeling Protocol, Stratified Sampling & Exhaustive Audit

1. **Stratified Sampling & Pooling:**
   * Up to 30 findings sampled randomly per repository **per tool** using PRNG Seed `42`.
   * Run 1 provides up to 30 findings per repo (up to 90 total across 3 repos), guaranteeing $n \ge 50$ for Gate 1 Wilson Score confidence bounds. Drift similarly contributes up to 30 sampled findings per repo.
   * All sampled findings are pooled into a single anonymized CSV without tool names or confidence scores.
   * Extrapolation formula for total repository violations:
     $$\text{Estimated Repo TPs} = \left(\frac{\text{TP}_{\text{sample}}}{n_{\text{sample}}}\right) \times N_{\text{total\_findings}}$$
2. **Review Status & Inter-Rater Agreement:**
   * **Status:** Pre-registered as **Internal Evaluation by Pre-Registered Rubric** (unambiguous, honest designation).
   * Evaluator A labels all findings into `[TP]`, `[FP-Intentional]`, or `[FP-Noise]`.
   * A random 20-sample subset is independently labeled by Evaluator B to compute Cohen's kappa $\kappa$.
   * Preliminary nature of Gate 1: Marked as preliminary baseline until external validation in Gate 5 (where 15–20 findings from the pool are presented to external developers).
3. **Procedure-Based Exhaustive Audit (Decoupling Recall Gap from Market Gap for Gate 3):**
   * **Pre-Registration of Conventions:** Prior to unblinding tool results, the auditor inspects repository documentation and core code to pre-register **3 dominant conventions** specific to each repository slice.
   * **Repository-Tailored Search Patterns:** The auditor constructs syntactically precise regexes matching the specific conventions of that repo (e.g. `\bfetch\(` or `from ['"]axios['"]` for rogue HTTP calls; `throw new (?!TRPCError\b)\w+` for cal.com backend services; `from ['"](?:yup|joi)['"]` for rogue validators).
   * **Ground-Truth Census:** The auditor exhaustively scans the designated slice to determine the exact total count of genuine violations ($N_{\text{ground\_truth}}$).
   * **Decoupled Evaluation & Softened Pivot Decision:**
     - If $N_{\text{ground\_truth}} \ge 3$ and Semvibe detected $< 3 \implies$ **Stop / Revise Engine** (proven recall failure on existing violations).
     - If $N_{\text{ground\_truth}} < 3$ across the 3 pre-registered conventions $\implies$ **Stop / Pivot-Review with Expanded Audit**. The auditor executes an expanded audit covering layer boundary inversions and state management before drawing conclusions.
