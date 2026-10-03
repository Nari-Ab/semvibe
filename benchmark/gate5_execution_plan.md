# Gate 5 Execution Plan: Real-World Developer Validation (Refined)
*Date: 2026-10-04 | Status: Ready for Field Sessions*

### 1. Goal & Boundaries
- **Objective:** Determine whether autonomous architectural invariant discovery solves an acute, actionable problem for active TypeScript developers using AI coding agents.
- **Rule 1 (Zero Deception & Their Own Code):** Run Semvibe on the volunteer's *own active repository*. Show the complete raw CLI output (including false alarms and context noise).
- **Rule 2 (Local Privacy Guarantee):** Zero tokens sent to external servers. The engine is 100% local and offline. The developer can run it themselves via terminal or screen share.
- **Rule 3 (Community Ethics):** No cold unsolicited PRs/Issues on strangers' repositories. Post invites in developer discords (Cursor, Claude Code, Anthropic Devs) and Reddit (`r/nextjs`, `r/typescript`) following self-promotion rules, offering a free architectural consistency audit report in exchange for 20 minutes of feedback.
- **Rule 4 (Strict 7-Day Timebox):** Allocate exactly 1 calendar week.

---

### 2. Item-by-Item Labeling Rubric (Recorded Verbatim)
Do NOT ask vague overall impressions. For **every individual finding** flagged by the tool on their codebase, ask the developer to assign one of three verdicts:
- **`[Fix]`**: "I consider this an unwanted deviation/bug and I would submit a PR to fix it."
- **`[Ignore]`**: "Technically divergent or intentional domain choice, but I would NOT spend time fixing it."
- **`[Bug/Noise]`**: "False alarm, incorrect analysis, or irrelevant style nit."

Record the developer's exact verbatim words without leading or defending the tool.

---

### 3. Pre-Registered Decision Matrix (Handling the "In-Between" Case)

| Outcome Scenario | Condition | Decision | Next Step |
| :--- | :--- | :--- | :--- |
| **Clear Value** | $\ge 3 / 5$ developers confirm majority of findings are `[Fix]` AND explicitly state they would keep it in CI. | **PROCEED (Go)** | Implement context classifier (Client vs Server vs Stream) and AST rules for Classes C & D. Validate on reserves (`payload`, `directus`). |
| **Clear Noise** | $\ge 3 / 5$ developers state findings are predominantly `[Noise]` or `[Ignore]`. | **STOP (No-Go / Pivot)** | Close Semvibe. Transition immediately to Project 2 (Реп). |
| **Ambiguous / In-Between** | 2 positive, 2 negative, 1 mixed (e.g. 2/2/1) OR fewer than 3 sessions completed in 7 days due to low developer interest. | **DEFAULT NO-GO / PIVOT** | Lack of strong organic demand or decisive majority is treated as a failed market signal. Avoid lingering in zombie state; pivot to Реп. |

---

### 4. Transition Pathway to Project 2: «Реп» (Rep)
If Gate 5 triggers the NO-GO / Pivot rule at the end of the 7-day timebox:
- Complete post-mortem documented in 1 page.
- Immediate pivot to **«Реп» (Rep)** — B2B SaaS for venue/establishment reputation and feedback management.
- Validation method: fast, cash-grounded customer discovery with 10 real venue managers/owners with pre-registered interview script and upfront commitment checks.
