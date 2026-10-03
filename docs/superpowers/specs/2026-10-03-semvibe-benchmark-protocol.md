# Semvibe: Benchmark & Go/No-Go Evaluation Protocol (Final Production Standard)
**Rigorous Pre-Registered Empirical Specification**
*Date: 2026-10-03*
*Engine Frozen Commit:* `ce461f7`

---

## 1. Pre-Registered Decision Rules (All Gates Mandatory)

> **CRITICAL RULE:** For a **"GO"** decision to Phase 2 commercial development, **ALL 5 GATES MUST PASS SIMULTANEOUSLY**. Failure of any single gate triggers an immediate **STOP / PIVOT** review.

| Gate | Target Metric | Statistical Formulation & Pass Condition | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 85\%$** | Wilson 95% CI lower bound $\ge 72\%$ on pooled sample ($n \ge 50$). If $n < 50$, mark **Inconclusive** and expand sample. | **Stop / Revise Engine:** Excessive noise destroys developer adoption. |
| **2. Seeded Recall** | **$\ge 85\%$ ($17/20$)** | Detected seeded mutations matching exact file, line $\pm 5$, and rule category. | **Stop / Revise Engine:** Blind to common architectural drift. |
| **3. Prevalence** | **$\ge 3$ verified TPs per repo** | Observed in at least 2 of 3 held-out repositories. | **Stop / Pivot Project:** Architectural drift is too rare in real code; no market need. |
| **4. Competitive Moat** | **$\ge 3$ Unique TPs** | Verified TPs caught by Semvibe that are **completely missed** by Drift and by the 3-run Agent Baseline. | **Stop / Pivot:** No technical differentiation over existing tools or raw agents. |
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

### Primary Held-Out Test Set (3 Repositories — FROZEN, evaluated once with zero code tweaks):
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

### Reserve Held-Out Test Set (2 Repositories — reserved if engine requires fixes):
* **Reserve 1:** `t3-oss/create-t3-app` (SHA: `4709861f7e67a15564c0460c13e7b4b6cfcae40d`)
* **Reserve 2:** `steven-tey/precedent` (SHA: `3be40205d7cdf56082cd284f07f12251b9208f79`)

---

## 3. Robust Baseline Repository & Mutation Detection Criteria

### 3.1 Robust Baseline Repository (`tests/benchmark/baseline-repo/`)
To eliminate statistical edge-effects, the baseline repo contains **10–12 files per convention**:
* 10 service files returning `Result<T, AppError>` (100% dominance).
* 10 controller files in `src/controllers/` routing to services (100% dominance).
* 8 API route files using `native-fetch` (100% dominance).
* 8 schema files using `zod` (100% dominance).
* 6 state stores using `zustand` (100% dominance).
* Strict layer separation: Controllers import services; services do NOT import controllers or UI; UI does NOT import DB.

**Negative Control Check:** `semvibe scan` on the un-mutated baseline MUST yield **exactly 0 violations**.

### 3.2 Criteria for Counting a Seeded Mutation as "Detected":
A seeded mutation is counted as detected ($+1$ to Recall) IF AND ONLY IF:
1. **Target File Match:** The finding's `filePath` corresponds exactly to the mutated file.
2. **Line Range Match:** The reported line number falls within $\pm 5$ lines of the mutated injection.
3. **Category Match:** The reported rule type matches the mutation category (e.g., error strategy, library collision, layer boundary).
*Any spurious or unrelated finding on another file is counted as a False Positive, NOT a mutation detection.*

---

## 4. Multi-Run Comparative Moat Matrix

Four runs are executed on the same held-out test set:

1. **Run 1: Pure AST Mode (`semvibe scan --ast-only`)**
2. **Run 2: Hybrid Semvibe (`semvibe scan`)**
   * Engine: Claude 3.7 Sonnet via local OmniRoute gateway (`http://localhost:20128/v1`).
   * Parameters: Temperature = `0.0`, 3 runs with majority voting.
3. **Run 3: `drift-analyzer[typescript]`**
   * Python CLI running local deterministic rules.
4. **Run 4: Autonomous Agent Explorer Baseline (3-Run Union)**
   * An AI agent with terminal access (`grep`, `cat`, `find`) given prompt: *"Analyze this repository and list all architectural inconsistencies, broken layer boundaries, and library redundancies."*
   * Run 3 times independently; union of findings forms the agent baseline.

### Rule for "Unique TP" (Gate 4):
A finding is classified as a **Unique TP** if:
* It is confirmed as `[TP]` by independent human review.
* Neither Drift nor the 3-Run Agent Baseline reported a violation on the same file and line ($\pm 10$ lines) within the same category.

---

## 5. Independent Blind Labeling & Suppression Audit

1. **Sampling & Pooling:**
   * Up to 30 findings sampled randomly per repository, pooled into a randomized CSV without tool names or confidence scores.
   * Extrapolation formula for total repository violations:
     $$\text{Estimated Repo TPs} = \left(\frac{\text{TP}_{\text{sample}}}{n_{\text{sample}}}\right) \times N_{\text{total\_findings}}$$
2. **Double-Blind Labeling:**
   * Evaluator A (independent developer not authoring Semvibe) labels all findings into `[TP]`, `[FP-Intentional]`, or `[FP-Noise]`.
   * Evaluator B independently labels a random 20-sample subset to measure Cohen's kappa. If $\kappa < 0.70$, rubrics are recalibrated and findings re-labeled.
3. **Negative Suppression Audit (False Negatives of the LLM):**
   * A random sample of 20 findings rejected by the LLM (which AST flagged) is inspected. If $\ge 3$ of them are genuine violations suppressed by the LLM, the LLM prompt is flagged as over-suppressive.
