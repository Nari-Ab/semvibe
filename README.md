<div align="center">

<img src="docs/assets/logo-v3.svg" alt="Semvibe" width="360">

### Catch architectural drift in AI-generated TypeScript codebases

[![CI](https://github.com/Nari-Ab/semvibe/actions/workflows/ci.yml/badge.svg)](https://github.com/Nari-Ab/semvibe/actions)
[![telemetry: zero](https://img.shields.io/badge/telemetry-zero%20(offline)-1f9d55)](#privacy--security)
[![npm version](https://img.shields.io/npm/v/semvibe?logo=npm&logoColor=white&label=npm&color=cb3837)](https://www.npmjs.com/package/semvibe)
[![npm downloads](https://img.shields.io/npm/dm/semvibe?label=downloads&color=0b7285)](https://www.npmjs.com/package/semvibe)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

When coding with Cursor, Claude Code, or Codex, projects gradually accumulate **architectural drift**: error contracts get mixed up (`throw` vs `{ error: ... }`), agents pull in redundant libraries (`axios` alongside native `fetch`), and conventions erode over time.

Semvibe analyzes your TypeScript AST locally, infers your project's dominant conventions, and flags files that deviate from them.

```bash
npx semvibe scan .    # scan project for architectural drift; 100% offline
npx semvibe learn .   # inspect discovered dominant conventions
```

What a finding looks like:

```text
semvibe scan — architectural drift in TypeScript codebases

❌ 2 architectural deviation(s) found in 428 scanned files

VIOLATIONS FOUND (2)

  ● lib/api/domains/utils.ts:6 in validateDomain()
      Observed: error-object | Expected: throw
      Reason:   95%+ of API routes throw AppError. Return object violates contract.
      Fix:      throw new AppError('Invalid domain', 422)

  ● auth/signup/utils/prefillAvatar.ts:1
      Observed: node-fetch | Expected: native-fetch
      Reason:   Project uses native fetch globally. Redundant library imported.
      Fix:      Remove node-fetch and use global fetch()
```

<div align="center">
  <img src="docs/assets/demo.gif" alt="Semvibe CLI demo scanning a Next.js codebase" width="840">
</div>

- **Infers conventions.** Semvibe learns what's standard from your own code patterns instead of forcing rigid, pre-configured rules.
- **Zero telemetry.** 100% offline and local. Zero network calls, zero tracking. Your code never leaves your machine. MIT.
- **Guards what's next.** Exports discovered conventions into `AGENTS.md` and `CLAUDE.md` to keep future AI coding agent sessions aligned with your architecture.

## Commands

- `npx semvibe scan [dir]` — Scan codebase for semantic outliers and contract deviations.
- `npx semvibe learn [dir]` — Discover and inspect dominant statistical invariants.
- `npx semvibe export-rules` — Export conventions into `AGENTS.md` and `CLAUDE.md` for AI agent guardrails.

## Current Status & Limitations

Semvibe is an experimental early preview (v0.1.0). We believe in transparent engineering data:

- **Noise / Precision:** On large, complex existing repositories, precision is currently **~39%**. Some findings will be intentional architectural deviations rather than genuine drift.
- **Coverage:** Currently focuses on **redundant library collisions** (e.g., rogue `axios` alongside native `fetch`, conflicting schema validators) and **mixed error-handling contracts** (`throw` vs `Result<T, E>` vs `{ error }`).
- **Best Use:** Run it as an advisory scan or pre-commit sanity check to spot subtle AI-introduced drift, rather than a hard blocking CI gate.

If you try it on your project, honest feedback on which findings you would actually fix vs ignore is the single most valuable contribution.

## Privacy & Security

Semvibe is built for security-conscious teams:
- Runs strictly on your local machine using static TypeScript AST analysis.
- Zero network requests. No external APIs, no analytics, no third-party telemetry.

## License

[MIT](LICENSE)
