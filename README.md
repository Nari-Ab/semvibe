# Semvibe

> **Zero-telemetry CLI to catch architectural drift and convention inconsistencies in TypeScript/Next.js projects.**

[![npm version](https://img.shields.io/npm/v/semvibe?color=cb3837&logo=npm)](https://www.npmjs.com/package/semvibe)
[![npm downloads](https://img.shields.io/npm/dm/semvibe?color=0b7285&label=downloads)](https://www.npmjs.com/package/semvibe)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/telemetry-zero%20(offline)-green.svg)](#privacy--security)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)


When coding with AI agents (Cursor, Claude Code, Copilot), projects gradually accumulate **architectural drift**:
- Mixed error handling (`throw new AppError()` in 95% of controllers, but `{ error: ... }` in recently generated files).
- Redundant or rogue libraries (`axios` added when the project standard is native `fetch`).
- Inconsistent contracts and conventions across layers.

**Semvibe** analyzes your codebase locally using TypeScript AST, infers your project's dominant architectural conventions, and flags files that deviate from them.

---

## Quick Start

Run it on your project in seconds without installing:

```bash
npx semvibe scan .
```

Or install globally:

```bash
npm install -g semvibe
semvibe scan .
```

---

## Example Output

```text
╔══════════════════════════════════════════════════════════╗
║                 semvibe · semantic scan                  ║
╚══════════════════════════════════════════════════════════╝

  Scanned:    /workspace/my-nextjs-app
  Files:      428
  Invariants: 6

  ❌ Found 3 Architectural Violations:

  #1 lib/api/domains/utils.ts:6 in validateDomain()
    Observed: error-object | Expected: throw
    Reason:   95%+ of controllers and API routes throw AppError. This function returns an error object.
    Fix:      Align code with standard: throw new AppError(...)

  #2 auth/signup/utils/prefillAvatar.ts:1
    Observed: node-fetch | Expected: native-fetch
    Reason:   Project standard is native fetch. Redundant dependency detected.
    Fix:      Align code with standard: native-fetch
```

---

## Commands

- `semvibe scan [directory]` — Scan for architectural drift and outliers.
- `semvibe learn [directory]` — Discover and inspect dominant invariants in your codebase.
- `semvibe export-rules` — Export discovered invariants into `AGENTS.md` and `CLAUDE.md` to guide AI coding agents.

---

## Privacy & Security

- **100% Local & Offline:** Semvibe runs entirely on your local machine.
- **Zero Telemetry:** No tracking, no analytics, no external network calls.
- **Your Code Stays Yours:** Not a single line of your code or file paths ever leaves your computer.

---

## License

[MIT](LICENSE)
