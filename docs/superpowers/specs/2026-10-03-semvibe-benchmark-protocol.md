# Semvibe: Benchmark & Go/No-Go Evaluation Protocol (Final Locked Specification)
**Pre-Registered Empirical Testing Standard**
*Date: 2026-10-03*
*Engine Frozen Commit:* `ce461f7` (Git tag: `benchmark-v5-frozen`, verified `git diff ce461f7 HEAD -- src/` is empty)
*Model ID (Fixed Baseline & Hybrid):* `claude-sonnet-5-5`
*Verifier Prompt Hash (SHA-256):* `9e8c28f6776055452b279b906fbc9d8ce323296f558c317415793e9f047e81c4`
*Agent Baseline Prompt Hash (SHA-256):* `43d662043940eaa53d12ccf94ed3a5e0e413278789e559eaa706dddeef2724bb`
*Sampling Seed:* `42`

---

## 1. Pre-Registered Decision Rules (Mandatory Simultaneous Gates)

> **CRITICAL RULE:** For a **"GO"** decision to Phase 2 commercial development, **ALL 5 GATES MUST PASS SIMULTANEOUSLY**. Failure of any single gate triggers an immediate **STOP / PIVOT** review.

| Gate | Target Metric | Statistical Formulation & Pass Condition | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 85\%$** | Wilson 95% CI lower bound $\ge 72\%$ on pooled Run 2 findings ($n \ge 50$, up to 30 sampled per repo per tool). If $n < 50$, expand to Expansion Repositories. | **Stop / Revise Engine:** Excessive noise destroys developer adoption. |
| **2. Seeded Recall** | **$\ge 85\%$ ($17/20$)** | Evaluated on full Hybrid mode (Run 2 settings: $T=0.2$, 3 votes). Detected single-injected mutations matching exact file, line $\pm 5$, and rule category. | **Stop / Revise Engine:** Engine blind to core architectural drift. |
| **3. Real-world Prevalence** | **$\ge 3$ verified TPs per repo** | Observed in at least 2 of 3 held-out repositories. Disambiguated by procedure-based exhaustive audit: if tool finds $< 3$ but audit confirms $\ge 3$ violations, action is **Revise** (Recall gap); if exhaustive 3-convention audit confirms $< 3$ violations across the designated slice, action is **Pivot-Review with Expanded Audit** (evaluating layer boundaries and state managers before initiating Pivot). | **Stop / Revise or Pivot-Review:** Decoupled by exhaustive audit. |
| **4. Competitive Moat** | **$\ge 3$ Unique TPs** | Verified TPs caught by Semvibe that are **completely missed** by Drift (`drift-analyzer[typescript]==2.51.1`) and by the 3-Run Agent Baseline. Pooled blind labeling across Runs 2, 3, and 4. | **Stop / Pivot:** No technical differentiation over existing tools or raw agents. |
| **5. Qualitative Utility** | **$\ge 3$ of 5 dev interviews confirm value** | Outside developers (non-colleagues) confirm findings on their repos warrant fixing in CI. | **Stop / Pivot:** Findings are technically true but developers don't care. |

---

## 2. Pinned Repositories (Verified URLs, Real Git SHAs & Scanned Slices)

All commit SHAs and scanned slices are strictly pre-registered to prevent post-hoc selection:

### Dev Calibration Set (2 Repositories — used solely for prompt calibration on `claude-sonnet-5-5`, never for scoring):
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
  * Scanned Slice: `cli/src`
  * Verified SHA: `4709861f7e67a15564c0460c13e7b4b6cfcae40d`
* **Expansion 2:** `steven-tey/precedent`
  * Scanned Slice: `app/`, `components/`, `lib/`
  * Verified SHA: `3be40205d7cdf56082cd284f07f12251b9208f79`

### Tier 2: Post-Revision Reserve Repositories (Held in strict reserve if engine fails and undergoes code fixes):
* **Reserve 1:** `payloadcms/payload`
  * Scanned Slice: `packages/payload/src`
  * Verified SHA: `15d051b5613d79293f607eab4b1a7e535b75b138`
* **Reserve 2:** `directus/directus`
  * Scanned Slice: `api/src`
  * Verified SHA: `f5be756db0d01c435ab683663c1c896c4d30db67`

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
Evaluated on **Hybrid Run 2** pipeline with the exact same runtime parameters (model: `claude-sonnet-5-5`, temperature $T=0.2$, 3 independent calls with $\ge 2/3$ majority voting). A seeded mutation is counted as detected ($+1$ to Recall) IF AND ONLY IF:
1. **Target File Match:** The finding's `filePath` corresponds exactly to the mutated file.
2. **Line Range Match:** The reported line number falls within $\pm 5$ lines of the mutated injection.
3. **Category Match:** The reported rule type matches the mutation category.

$$\text{Recall} = \frac{\text{Detected Injections}}{20} \quad (\text{Target} \ge 85\%)$$

---

## 4. Multi-Run Comparative Moat Matrix & Parameters

Four parallel evaluations are executed on the same held-out test set:

1. **Run 1: Pure AST Mode (`semvibe scan --ast-only`)**
2. **Run 2: Hybrid Semvibe (`semvibe scan`)**
   * Model: `claude-sonnet-5-5` via local OmniRoute gateway (`http://localhost:20128/v1`).
   * Parameters: Temperature = `0.2` for independent sampling.
   * Execution & Voting Protocol: Three independent API calls are executed per outlier candidate without caching. Raw outputs `[raw_1, raw_2, raw_3]` are logged to `benchmark/raw_runs/run2_*.json`. A candidate is marked as a violation iff $\ge 2$ of 3 runs classify it as `isTruePositive: true`. ONLY AFTER all raw votes are recorded, the resulting consensus is serialized and cached to disk for deterministic offline replay and auditing.
3. **Run 3: `drift-analyzer[typescript]==2.51.1`**
   * Version: Exact pinned release `2.51.1` installed with `pip install "drift-analyzer[typescript]==2.51.1"`, running local deterministic AST/CST rules.
4. **Run 4: Autonomous Agent Explorer Baseline (3-Run Union)**
   * AI agent powered by `claude-sonnet-5-5` given terminal tools (`grep`, `cat`, `find`) with prompt: *"Analyze this repository and list all architectural inconsistencies, broken layer boundaries, and library redundancies."* (SHA-256: `43d662043940eaa53d12ccf94ed3a5e0e413278789e559eaa706dddeef2724bb`).
   * Run 3 times independently; raw interaction traces saved; union of findings forms the agent baseline.
   * Note on Dev Set Calibration: Both the Semvibe verifier prompts and agent system prompts were calibrated strictly on `claude-sonnet-5-5` using the 2 Dev Set repositories, ensuring zero cross-model drift.

### Rule for "Unique TP" & Agent Output Categorization (Gate 4):
A finding is classified as a **Unique TP** if:
* It is confirmed as `[TP]` by independent human review.
* Neither Drift nor the 3-Run Agent Baseline reported a violation on the same file and line ($\pm 10$ lines) within the same category.
* **Agent Free-Text Categorization Protocol:** The Agent Baseline outputs unstructured natural language. Evaluator A (blind to tool origin) maps each agent finding to one of the 4 standard architectural categories using the pre-registered rubric. To eliminate negative bias against the baseline, an **inclusive match rule** applies: any agent finding within $\pm 10$ lines citing the same code symbol or architectural deviation is matched and credited to the agent.
* **Symbolic Fallback Match Rule for Agent Findings Without Line Numbers:** If an agent finding does not provide line numbers or a line range, a match is credited if the agent names the exact target file AND explicitly identifies the offending function, class, or imported package corresponding to the violation.
* All findings from Runs 2, 3, and 4 are exported to a single unified CSV for blind human review.

---

## 5. Independent Blind Labeling, Stratified Sampling & Exhaustive Audit

1. **Stratified Sampling & Pooling (Preventing Sample Starvation):**
   * Up to 30 findings sampled randomly per repository **per tool** using PRNG Seed `42`.
   * Specifically: Run 2 yields up to 30 findings per repo (up to 90 total across 3 repos), guaranteeing $n \ge 50$ for Gate 1 Wilson Score confidence bounds. Drift and Agent Baseline similarly contribute up to 30 sampled findings per repo.
   * All sampled findings are pooled into a single anonymized CSV without tool names or confidence scores.
   * Extrapolation formula for total repository violations:
     $$\text{Estimated Repo TPs} = \left(\frac{\text{TP}_{\text{sample}}}{n_{\text{sample}}}\right) \times N_{\text{total\_findings}}$$
2. **Double-Blind Review & Inter-Rater Agreement:**
   * Evaluator A (independent developer not authoring Semvibe) labels all findings into `[TP]`, `[FP-Intentional]`, or `[FP-Noise]`.
   * A random 20-sample subset is independently labeled by Evaluator B to compute Cohen's kappa. If $\kappa < 0.70$, rubrics are recalibrated and findings re-labeled.
3. **Negative Suppression Audit (Actionable Recall Gate):**
   * A random sample of 20 findings rejected by the LLM (which AST flagged) is inspected.
   * **Failure Condition:** If $\ge 3$ of 20 rejected findings are verified `[TP]` (true violations mistakenly suppressed), the run is **invalidated** due to excessive false negative suppression, triggering a prompt revision before re-testing on Tier 2 Reserve Repositories.
4. **Procedure-Based Exhaustive Audit (Decoupling Recall Gap from Market Gap for Gate 3):**
   * Universal rigid regexes fail across heterogeneous repositories (e.g. `fetch` is global and not imported via `from 'fetch'`; `got` matches English prose; in `cal.com` `throw new TRPCError` is an intended convention rather than a deviation).
   * **Standardized Pre-Audit Procedure:**
     1. **Pre-Registration of Conventions:** Prior to unblinding any tool results, the auditor inspects repository documentation (`README.md`, `CONTRIBUTING.md`, `AGENTS.md`) and the dominant codebase patterns to pre-register **3 dominant conventions** specific to that repository slice (e.g., error pattern, HTTP client/fetch wrapper, schema validator, or layer isolation).
     2. **Repository-Tailored Search Patterns:** The auditor constructs syntactically precise regexes matching the specific conventions of that repo (e.g. `\bfetch\(` or `from ['"]axios['"]` for rogue HTTP calls; `throw new (?!TRPCError\b)\w+` for cal.com backend services; `from ['"](?:yup|joi)['"]` for rogue validators).
     3. **Ground-Truth Census:** The auditor exhaustively scans the designated slice to determine the exact total count of genuine violations ($N_{\text{ground\_truth}}$).
   * **Decoupled Evaluation & Softened Pivot Decision:**
     - If $N_{\text{ground\_truth}} \ge 3$ and Semvibe detected $< 3 \implies$ **Stop / Revise Engine** (proven recall failure on existing violations).
     - If $N_{\text{ground\_truth}} < 3$ across the 3 pre-registered conventions $\implies$ **Stop / Pivot-Review with Expanded Audit**. Absence of violations in 3 conventions does not prove absence of drift across other architectural dimensions. The auditor executes an expanded audit covering layer boundary inversions and state management. Only if the expanded audit also confirms $< 3$ violations across all dimensions does the team conclude that this repository category exhibits natural architectural cleanliness, triggering a market pivot.
