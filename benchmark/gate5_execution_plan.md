# Gate 5 Execution Plan: Real-World Developer Validation
*Revised 2026-10-04 following empirical benchmark review*

### 1. Goal & Guardrails
- **Objective:** Test whether autonomous architectural invariant scanning provides real value to active developers using AI coding agents.
- **Rule 1 (Honesty):** Run Semvibe on the volunteer's *own* active TypeScript/Next.js repository. Show them the full raw CLI output (including potential FP-Intentional findings), not cherry-picked findings from external repos.
- **Rule 2 (Ethical Outreach):** Do NOT open unsolicited GitHub Issues or Pull Requests on strangers' public repositories. Recruit 3–5 active volunteers via Discord (Cursor, Claude Code, Anthropic Devs), Reddit (`r/nextjs`, `r/typescript`), or Twitter/X.
- **Rule 3 (1-Week Timebox):** Allocate exactly 7 days. If $\ge 3/5$ developers say "would not fix" or "too noisy for CI", stop investing in Classes C/D and pivot immediately.

### 2. Interview Script & Questioning
For each volunteer:
1. Run `npx semvibe scan .` on their repo.
2. Present findings and ask 3 specific questions:
   - *Q1:* "Does finding [X] point out a convention you actually intended to follow across this project, or is it an intentional design choice / noise?"
   - *Q2:* "If this check ran in your GitHub Actions CI or pre-commit hook, would you fix this code or would it cause workflow friction?"
   - *Q3:* "Have you noticed AI coding agents (Cursor, Claude, Copilot) introducing this kind of pattern divergence in your PRs?"

### 3. Decision Matrix
- **$\ge 3/5$ say "Valuable / Would fix":**
  - Implement Tier/Context classification (Client Components / React Hooks vs Server Actions / API Routes).
  - Implement AST graph detectors for Class C (layer inversion) and Class D (unencapsulated globals).
  - Validate on fresh reserve repositories (`payload`, `directus`) and a new independent set of 20 mutations.
- **$\le 2/5$ say "Valuable" (or find noise intolerable):**
  - **PIVOT:** Acknowledge that statistical invariant discovery on syntactic patterns does not solve a sufficiently acute pain point for developers. Pivot to alternative hypotheses (e.g. Rep or Hallucinate).
