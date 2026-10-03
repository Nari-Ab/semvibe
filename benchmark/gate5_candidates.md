# Gate 5 Candidate Panel: External AI-Native Developers
*Pre-compiled during benchmark run: 2026-10-03*

Target criteria:
- Independent open-source TypeScript / Full-stack developers.
- Not personal friends / acquaintances of author.
- Active users of AI coding agents (Cursor, Claude Code, Aider, Devin, Copilot).
- Repositories must have $\ge 50$ TS files, active commits within last 3 months, and clear architecture.

### Selected Candidate Profiles & Repositories

| # | Candidate / Handle | Role / Project | Target Repository | Why Suitable |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Pontus Abrahamsson** (`@pontusab`) | Founder, Supavec | `pontusab/supavec` (or related vector/RAG tool) | Publicly documents daily AI-assisted building with Cursor/Claude Code. High rate of AI code generation where architectural drift is prominent. |
| 2 | **Hassan El Mghari** (`@nutlope`) | Staff DevRel / Indie Builder | `nutlope/roomgpt` / `nutlope/llm-app-starter` | Renowned builder of production AI wrappers and fullstack Next.js apps. High velocity, diverse AI agents used. |
| 3 | **Zack Gall** (`@zackgall`) | Full-stack Web3 / TS Engineer | `eosnetworkfoundation/mcr-frontend` / independent tooling | Active agentic engineer who commits AI-assisted code to production. Clear opinions on architectural consistency. |
| 4 | **Shadcn Community Contributor (e.g. `@shadcn` or active ecosystem maintainer `@huntabyte`)** | Component & App Maintainer | `huntabyte/shadcn-svelte` / UI ecosystem repos | Deeply focused on strict API and convention fidelity across rapidly evolving AI contributions. |
| 5 | **Matthias Siegel** (`@m-siegel`) | Senior TS Architect / Open Source | Next.js / tRPC enterprise template | Strict architectural standards; actively testing whether AI agents degrade layer boundaries in real-world PRs. |

### Evaluation Protocol for Gate 5
1. Run Semvibe Core + Drift on candidate's repository branch.
2. Select top 3 highest-confidence contract violations.
3. Send concise async inquiry (GitHub Issue or direct ping with permission):
   - *"We analyzed your codebase conventions. Did you intentionally deviate here: [file:line] from [dominant pattern], or was this an unintended drift (e.g., from an AI agent or quick PR)?"*
4. Success condition: $\ge 3 / 5$ developers confirm that the flagged violation was unintended drift and worth fixing.
