# Semvibe: Benchmark & Go/No-Go Evaluation Protocol (Final Locked Specification)
**Pre-Registered Empirical Testing Standard**
*Date: 2026-10-03*
*Engine Frozen Commit:* `ce461f7`
*Prompt Hash (SHA-256):* `4a9f2e8b...`
*Sampling Seed:* `42`

---

## 1. Pre-Registered Decision Rules (Mandatory Simultaneous Gates)

> **CRITICAL RULE:** For a **"GO"** decision to Phase 2 commercial development, **ALL 5 GATES MUST PASS SIMULTANEOUSLY**. Failure of any single gate triggers an immediate **STOP / PIVOT** review.

| Gate | Target Metric | Statistical Formulation & Pass Condition | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 85\%$** | Wilson 95% CI lower bound $\ge 72\%$ on pooled Run 2 findings ($n \ge 50$, up to 30 sampled per repo). If $n < 50$, expand to Expansion Repositories. | **Stop / Revise Engine:** Excessive noise destroys developer adoption. |
| **2. Seeded Recall** | **$\ge 85\%$ ($17/20$)** | Evaluated on full Hybrid mode (Run 2). Detected single-injected mutations matching exact file, line $\pm 5$, and rule category. | **Stop / Revise Engine:** Engine blind to core architectural drift. |
| **3. Real-world Prevalence** | **$\ge 3$ verified TPs per repo** | Observed in at least 2 of 3 held-out repositories. Disambiguated by 30-function manual spot audit: if tool finds $< 3$ but audit finds $\ge 3$, action is **Revise** (Recall gap); if audit also finds $0$, action is **Pivot** (market gap). | **Stop / Revise or Pivot:** Decoupled by spot audit. |
| **4. Competitive Moat** | **$\ge 3$ Unique TPs** | Verified TPs caught by Semvibe that are **completely missed** by Drift and by the 3-Run Agent Baseline. Pooled blind labeling across Runs 2, 3, and 4. | **Stop / Pivot:** No technical differentiation over existing tools or raw agents. |
| **5. Qualitative Utility** | **$\ge 3$ of 5 dev interviews confirm value** | Outside developers (non-colleagues) confirm findings on their repos warrant fixing in CI. | **Stop / Pivot:** Findings are technically true but developers don't care. |

---

## 2. Pinned Repositories (Verified URLs & Real Git SHAs)

All commit SHAs are verified directly via Git:

### Dev Calibration Set (2 Repositories — used solely for prompt calibration, never for scoring):
1. **`AGGIB/QIP` (Frontend Slice)**
   * Commit SHA: `6a81c547c1ec3ba834231881d403d25ee12c15ca`
   * Characteristics: Local Next.js 15 App Router, React 19, TypeScript with explicit `AGENTS.md`.
2. **`shadcn-ui/taxonomy`**
   * Commit SHA: `298a8857c7128a0d121e7f699dfd729f23b3966d`
   * Characteristics: Next.js 14 App Router, Prisma, Zod, Tailwind.

### Primary Held-Out Test Set (3 Repositories — FROZEN, single execution):
3. **Repo A (Fast-Paced Next.js Web Application):**
   * Repo: `dubinc/dub` (Slice: `apps/web`)
   * URL: `https://github.com/dubinc/dub.git`
   * Verified SHA: `6b2d17fd827d058ff9f5709630677260740055da`
4. **Repo B (Multi-tier Backend Service Layer):**
   * Repo: `calcom/cal.com` (Slice: `packages/trpc` + `packages/features`)
   * URL: `https://github.com/calcom/cal.com.git`
   * Verified SHA: `54343aa685ae8f33159d2f485ec4a57bad5c574a`
5. **Repo C (Modern SaaS Starter):**
   * Repo: `leerob/next-saas-starter`
   * URL: `https://github.com/leerob/next-saas-starter.git`
   * Verified SHA: `6e33e58b1e553a41fe22e6b941a7229a002de361`

### Tier 1: Sample Expansion Repositories (Activated ONLY if primary held-out yields $n < 50$ findings):
* **Expansion 1:** `t3-oss/create-t3-app` (SHA: `4709861f7e67a15564c0460c13e7b4b6cfcae40d`)
* **Expansion 2:** `steven-tey/precedent` (SHA: `3be40205d7cdf56082cd284f07f12251b9208f79`)

### Tier 2: Post-Revision Reserve Repositories (Held in strict reserve if engine fails and undergoes code fixes):
* **Reserve 1:** `payloadcms/payload` (SHA: verified on clone)
* **Reserve 2:** `directus/directus` (SHA: verified on clone)

*Limitation Statement:* The test corpus evaluates general multi-contributor TypeScript repositories. The percentage of AI co-author commits per repository will be measured and reported as an observational covariate, not an unverified premise.

---

## 3. Robust Baseline Repository & Complete Mutation Suite (20 Seeded Injections)

### 3.1 Robust Baseline Repository (`tests/benchmark/baseline-repo/`)
To eliminate statistical edge-effects, the baseline repo contains **10–12 files per convention**:
* 10 service files returning `Result<T, AppError>` (100% dominance).
* 10 controller files in `src/controllers/` routing to services (100% dominance).
* 8 API route files using `native-fetch` (100% dominance).
* 8 schema files using `zod` (100% dominance).
* 6 state stores using `zustand` (100% dominance).
* Strict layer separation: Controllers import services; services do NOT import controllers or UI; UI does NOT import DB.

**Two-Stage Negative Control Check:**
1. Running `semvibe learn` on the un-mutated baseline MUST discover all 5 invariants with $\ge 80\%$ confidence.
2. Running `semvibe scan` on the un-mutated baseline MUST yield **exactly 0 violations**.

### 3.2 Independent Mutation Generation & Injection Protocol
* Mutations are authored by an independent script/model without access to Semvibe's source code or `PACKAGE_ROLES` dictionary.
* **Isolated Single-Injection Testing:** Each mutation is tested against an independent copy of the baseline repository (one mutation per copy). This prevents 20 simultaneous mutations from artificially breaking the baseline's 75% dominance threshold.

### 3.3 The 20 Mutation Classes (Strictly Phase 1 Aligned):
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

### 3.4 Criteria for Counting a Seeded Mutation as "Detected":
Evaluated on **Hybrid Run 2** pipeline. A seeded mutation is counted as detected ($+1$ to Recall) IF AND ONLY IF:
1. **Target File Match:** The finding's `filePath` corresponds exactly to the mutated file.
2. **Line Range Match:** The reported line number falls within $\pm 5$ lines of the mutated injection.
3. **Category Match:** The reported rule type matches the mutation category.

$$\text{Recall} = \frac{\text{Detected Injections}}{20} \quad (\text{Target} \ge 85\%)$$

---

## 4. Multi-Run Comparative Moat Matrix & Parameters

Four parallel evaluations are executed on the same held-out test set:

1. **Run 1: Pure AST Mode (`semvibe scan --ast-only`)**
2. **Run 2: Hybrid Semvibe (`semvibe scan`)**
   * Model: `claude-3-5-sonnet-20241022` via local OmniRoute gateway (`http://localhost:20128/v1`).
   * Parameters: Temperature = `0.0`, response caching enabled, 3 runs with majority voting.
3. **Run 3: `drift-analyzer[typescript]`**
   * Version: `drift-analyzer >= 1.4.2` running local deterministic rules.
4. **Run 4: Autonomous Agent Explorer Baseline (3-Run Union)**
   * AI agent powered by `claude-3-5-sonnet-20241022` given terminal tools (`grep`, `cat`, `find`) with prompt: *"Analyze this repository and list all architectural inconsistencies, broken layer boundaries, and library redundancies."*
   * Run 3 times independently; union of findings forms the agent baseline.

### Rule for "Unique TP" (Gate 4):
A finding is classified as a **Unique TP** if:
* It is confirmed as `[TP]` by independent human review.
* Neither Drift nor the 3-Run Agent Baseline reported a violation on the same file and line ($\pm 10$ lines) within the same category.
* All findings from Runs 2, 3, and 4 are exported to a single unified CSV for blind human review.

---

## 5. Independent Blind Labeling & Suppression Audit

1. **Sampling & Pooling:**
   * Up to 30 findings sampled randomly per repository using PRNG Seed `42`, pooled across all runs into a randomized CSV without tool names or confidence scores.
   * Extrapolation formula for total repository violations:
     $$\text{Estimated Repo TPs} = \left(\frac{\text{TP}_{\text{sample}}}{n_{\text{sample}}}\right) \times N_{\text{total\_findings}}$$
2. **Double-Blind Review & Inter-Rater Agreement:**
   * Evaluator A (independent developer not authoring Semvibe) labels all findings into `[TP]`, `[FP-Intentional]`, or `[FP-Noise]`.
   * A random 20-sample subset is independently labeled by Evaluator B to compute Cohen's kappa. If $\kappa < 0.70$, rubrics are recalibrated and findings re-labeled.
3. **Negative Suppression Audit (Actionable Recall Gate):**
   * A random sample of 20 findings rejected by the LLM (which AST flagged) is inspected.
   * **Failure Condition:** If $\ge 3$ of 20 rejected findings are verified `[TP]` (true violations mistakenly suppressed), the run is **invalidated** due to excessive false negative suppression, triggering a prompt revision before re-testing on Tier 2 Reserve Repositories.
