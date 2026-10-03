# Semvibe: Benchmark & Go/No-Go Evaluation Protocol (Final v3)
**Rigorous Pre-Registered Empirical Specification**
*Date: 2026-10-03*
*Engine Frozen Commit:* `ce461f7`

---

## 1. Pinned Repositories (Verified URLs & Real Git SHAs)

All commit SHAs have been strictly verified via `git ls-remote` against GitHub:

### Dev Calibration Set (2 Repositories — for calibrating rules and prompt templates):
1. **`AGGIB/QIP` (Frontend Slice)**
   * URL: `git@github.com:AGGIB/QIP.git`
   * Commit SHA: `6a81c547c1ec3ba834231881d403d25ee12c15ca`
   * Stack: Next.js 15 App Router, React 19, TypeScript.
2. **`shadcn-ui/taxonomy`**
   * URL: `https://github.com/shadcn-ui/taxonomy.git`
   * Commit SHA: `298a8857c7128a0d121e7f699dfd729f23b3966d`
   * Stack: Next.js 14 App Router, Prisma, Zod, Tailwind.

### Primary Held-Out Test Set (3 Repositories — FROZEN, single execution):
3. **Repo A (AI-Vibe Coded SaaS Web App):**
   * Repo: `dubinc/dub` (Slice: `apps/web`)
   * URL: `https://github.com/dubinc/dub.git`
   * Verified SHA: `6b2d17fd827d058ff9f5709630677260740055da`
   * Characteristics: Fast-paced Next.js application with active multi-author AI development and community PRs.
4. **Repo B (Multi-tier Backend Service Layer):**
   * Repo: `calcom/cal.com` (Slice: `packages/trpc` + `packages/features`)
   * URL: `https://github.com/calcom/cal.com.git`
   * Verified SHA: `54343aa685ae8f33159d2f485ec4a57bad5c574a`
   * Characteristics: Production enterprise TypeScript monorepo with clean layering, strict RPC schemas, and complex error handling.
5. **Repo C (Full-Stack AI Starter / Boilerplate):**
   * Repo: `leerob/next-saas-starter`
   * URL: `https://github.com/leerob/next-saas-starter.git`
   * Verified SHA: `6e33e58b1e553a41fe22e6b941a7229a002de361`
   * Characteristics: Modern Next.js 15, Server Actions, Drizzle ORM, Stripe.

### Reserve Held-Out Test Set (2 Repositories — Held in reserve if post-fix re-evaluation is needed):
* **Reserve 1:** `t3-oss/create-t3-app` (SHA: `4709861f7e67a15564c0460c13e7b4b6cfcae40d`)
* **Reserve 2:** `steven-tey/precedent` (SHA: `3be40205d7cdf56082cd284f07f12251b9208f79`)

---

## 2. Baseline Fixture & Mutation Protocol (Recall Evaluation)

### 2.1 The Baseline Repository (`tests/benchmark/baseline-repo/`)
To guarantee that mutations test true detection rather than the absence of invariants, a verified baseline repository is constructed containing:
* 5 service files returning `Result<T, AppError>` (80%+ dominance).
* 4 API route files using `native-fetch` (100% dominance).
* 4 schema files using `zod` (100% dominance).
* 3 state stores using `zustand` (100% dominance).
* Strict layer separation (UI components do not import database layer; services do not import UI).

**Negative Control Gate:** Running `semvibe learn` on this baseline MUST discover all 4 invariants with $\ge 80\%$ confidence, and running `semvibe scan` on the un-mutated baseline MUST yield **exactly 0 violations**.

### 2.2 Independent Mutation Generation & Injection
* Mutations are authored by an independent script/model without access to Semvibe's source code or `PACKAGE_ROLES` dictionary.
* **Isolated Single-Injection Testing:** Each mutation is tested against an independent copy of the baseline repository (one mutation per copy). This prevents 20 simultaneous mutations from artificially breaking the baseline's 75% dominance threshold.

### 2.3 The 20 Mutation Classes (Strictly Phase 1 Aligned):
* **Error Handling Inconsistencies (6):**
  1. Service method throwing raw `new Error("msg")`.
  2. Service method returning `{ success: false, error: "msg" }`.
  3. Service method returning `{ error: "failed" }`.
  4. Service method throwing raw string (`throw "unauthorized"`).
  5. Controller method throwing untyped custom exception.
  6. Service method returning `undefined` silently on error.
* **Library Role Collisions (7):**
  7. Rogue `axios` imported in service.
  8. Rogue `got` imported in service.
  9. Rogue `superagent` imported in service.
  10. Rogue `yup` schema in validation module.
  11. Rogue `joi` validator in validation module.
  12. Rogue `jotai` atom in store module.
  13. Rogue `mobx` observable in store module.
* **Layer Inversions (4):**
  14. UI Component importing `@prisma/client` directly.
  15. UI Component importing server database driver.
  16. Service layer importing presentation component (`components/Button`).
  17. Controller directly executing low-level raw SQL driver.
* **Unencapsulated Global Calls (3):**
  18. Raw global `fetch()` call inside UI component bypassing client wrapper.
  19. Raw global `fetch()` call in service without error handling.
  20. Raw global `fetch()` call in utility without project headers.

$$\text{Recall} = \frac{\text{Detected Injections}}{20} \quad (\text{Target} \ge 85\%)$$

---

## 3. Pre-Registered Go/No-Go Decision Rules

| Gate | Target Metric | Statistical Formulation | Failure Action |
| :--- | :--- | :--- | :--- |
| **1. Precision** | **Point Estimate $\ge 85\%$** | Wilson 95% CI lower bound $\ge 72\%$ on pooled findings ($n \ge 50$) | **Stop/Revise Engine:** Tool generates too much noise for developers. |
| **2. Recall** | **$\ge 85\%$ ($17/20$)** | Detected single-injected mutations | **Stop/Revise Engine:** Engine misses basic architectural drift. |
| **3. Prevalence** | **$\ge 1.0$ verified TP per 1,000 scanned LOC** | Observed in at least 2 of 3 held-out test repositories | **Stop/Pivot Project:** Architectural drift is too rare in practice; no real market problem. |
| **4. Competitive Moat** | **$\ge 3$ Unique TPs** | Findings caught by Semvibe that are MISSED by Drift and by an Autonomous Agent Baseline | **Stop/Pivot:** If existing tools or a raw agent find the same issues, Semvibe has no technical moat. |
| **5. Qualitative Utility** | **$\ge 3$ of 5 dev interviews confirm value** | Devs agree findings in their own code are worth fixing | **Stop/Pivot:** Findings are technically true but devs don't care to fix them. |

---

## 4. Multi-Run Comparative Moat Matrix

Four parallel evaluations are executed on the same held-out test set:

1. **Run 1: Pure AST Mode (`semvibe scan --ast-only`):**
   * Fast, zero-token baseline.
2. **Run 2: Hybrid Semvibe (`semvibe scan`):**
   * Config: Claude 3.7 Sonnet / DeepSeek V3 via OmniRoute, Temperature = `0.0`, 3 repetition majority voting.
3. **Run 3: `drift-analyzer[typescript]`:**
   * Python/CLI package running local deterministic rules.
4. **Run 4: Autonomous Agent Explorer Baseline:**
   * An AI agent with terminal file access (`grep`, `cat`) given prompt: *"Examine this repository and list all architectural inconsistencies, broken layer boundaries, and library redundancies."*
   * Measures latency, total tokens, and false-positive rate compared to Semvibe's deterministic invariant extraction.

---

## 5. Independent Blind Labeling Protocol

1. **Sample Selection & Stratification:**
   * LOC is counted strictly across scanned TypeScript/JavaScript source files (excluding tests, mocks, and `.d.ts`).
   * A stratified random sample of candidate findings (up to 30 per repository, pooled to $n \ge 50$) is exported to a randomized CSV with origin and tool identity masked.
2. **Double-Blind Review:**
   * Evaluator A (independent human developer) classifies each finding as `[TP]`, `[FP-Intentional]`, or `[FP-Noise]`.
   * A random 20-sample subset is independently labeled by Evaluator B to compute inter-rater agreement (Cohen's $\kappa \ge 0.70$).
