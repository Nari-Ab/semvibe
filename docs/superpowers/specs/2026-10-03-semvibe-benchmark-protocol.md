# Semvibe: Benchmark & Go/No-Go Evaluation Protocol
**Rigorous Independent Testing Specification**
*Date: 2026-10-03*
*Frozen Code Hash:* `ce461f7`

---

## 1. Objective & Success Thresholds (Pre-Registered Go/No-Go Gates)

Before running the final benchmark, we pre-register the exact mathematical criteria for deciding whether to proceed with commercial investment (Phase 2):

| Metric | Target Gate | Minimum Acceptable Floor (95% CI) | Rationale |
| :--- | :--- | :--- | :--- |
| **Precision** | **≥ 85%** | Floor ≥ 75% ($n \ge 50$ findings) | Developers immediately turn off linters with high false-positive rates. |
| **Recall (Seeded Mutations)** | **≥ 85%** | Floor ≥ 70% (20 seeded mutations) | The tool must reliably catch common AI-induced drift. |
| **Prevalence (Real-world Utility)** | **≥ 2 findings / repo** | In at least 3 of 4 audited repos | If real repos have 0 drift, the market problem does not exist. |
| **Moat over Drift & ESLint** | **≥ 3 unique findings** | Semantically detected issues | Proves the necessity of the hybrid AST + LLM architecture. |

---

## 2. Dataset Selection & Train/Test Split

To prevent overfitting, repositories are strictly partitioned into **Dev Calibration** and **Held-Out Test Sets**:

### Dev Set (2 Repositories — for rule calibration & prompt verification):
1. **`QIP/frontend`** (Local Next.js 15, App Router, React 19, TypeScript).
2. **`shadcn-table / next-starter`** (AI-assisted web application slice with Tailwind and Zod).

### Held-Out Test Set (3 Repositories — FROZEN, evaluated once with zero code tweaks):
3. **Repository A (AI-Vibe Repository):** A public GitHub repository created with Cursor/Claude Code containing explicit `.cursorrules` / `CLAUDE.md` and AI commit co-authors.
4. **Repository B (Multi-tier Backend):** A production tRPC/NestJS + Prisma service layer with strict layer boundaries.
5. **Repository C (Full-Stack OSS SaaS):** An open-source Next.js + DB boilerplate with multiple contributors.

---

## 3. Ground-Truth Blind Labeling Rubric

Every candidate violation output by `semvibe scan` will be assigned one of three mutually exclusive labels:

* **[TP] True Positive (Genuine Architectural Inconsistency):**
  * The code violates an established repository-wide convention (e.g. introducing `native-fetch` with raw headers when a unified `lib/api` client exists; or throwing raw `Error` in a layer where 90% of peers return `Result<T, E>`).
  * A human tech-lead would request a change during code review.
* **[FP-Intentional] False Positive (Legitimate Special Case):**
  * The code violates the dominant pattern for a valid technical reason (e.g. fatal process startup exit, CLI panic handler, unhandled crash guard).
* **[FP-Noise] False Positive (Extraction / Analysis Error):**
  * Parser misinterpreted types, misclassified a layer, or flagged dead/generated code.

**Precision Formula:**
$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP-Intentional} + \text{FP-Noise}}$$

---

## 4. Recall Evaluation via Seeded Mutations (Mutation Testing)

Because counting all non-violations in large repos is prohibitively noisy, Recall is measured by injecting **20 known architectural mutations** into a clean baseline repository:

* **5 Layer Boundary Mutations:**
  * Direct DB query from React component.
  * Direct DB query from API route bypassing service.
  * Service layer importing UI component.
  * Controller importing internal database driver.
  * Domain model importing presentation helper.
* **5 Library Redundancy Mutations:**
  * Rogue `axios` imported in a project standardized on `fetch`.
  * Rogue `superagent` call.
  * Rogue `yup` schema in a project standardized on `zod`.
  * Rogue `jotai` hook in a project standardized on `zustand`.
  * Rogue `date-fns` imported when `dayjs` is standard.
* **5 Error Handling Mutations:**
  * Raw `throw new Error()` in service method when `Result` is standard.
  * Raw `{ error: "msg" }` object literal when class hierarchy is standard.
  * Unhandled async promise rejection in controller.
  * Raw HTTP status code return in domain layer.
  * Missing error envelope in REST route.
* **5 Semantic Invariant Mutations:**
  * Function bypassing established auth middleware.
  * Direct environment variable access (`process.env.SECRET`) bypassing config module.
  * Ad-hoc fetch without tenant headers.
  * Ad-hoc JSON serialization bypassing DTO validator.
  * Bypassing logging wrapper in critical service.

$$\text{Recall} = \frac{\text{Seeded Mutations Detected}}{\text{Total Seeded Mutations (20)}}$$

---

## 5. Execution Environment & Reproducibility Controls

* **Commit Hash:** `ce461f7` (frozen, zero code edits during the run).
* **LLM Engine:** Local **OmniRoute Gateway** (`http://localhost:20128/v1`) using Anthropic Claude / DeepSeek V3 with temperature = `0.0` (strictly deterministic).
* **Baseline Comparison:**
  * Run 1: Pure AST mode (`semvibe scan --ast-only`).
  * Run 2: Hybrid mode (`semvibe scan`).
  * Run 3: `drift analyze` / `drift-analyzer[typescript]`.
* **Telemetry Recorded:** Execution time (seconds), tokens consumed, and cost per 1,000 LOC.
