# Semvibe Phase 1 (Lean Core MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Semvibe Phase 1 Lean Core MVP: TypeScript AST extraction, statistical invariant discovery (`semvibe learn`), semantic outlier detection (`semvibe scan`), targeted LLM verification, and agent guardrail generator (`semvibe export-rules`).

**Architecture:** A two-phase hybrid engine where a fast, zero-token TypeScript AST extractor indexes import hierarchies, error handling schemas, and dependency usage. Statistical clustering identifies dominant patterns (>75%) and flags candidate invariants or unresolved style splits. Statistical outliers are fed to a targeted LLM verifier (Anthropic API / Ollama / OpenAI-compatible) to eliminate false positives, and confirmed invariants can be exported directly into `.cursorrules` and `CLAUDE.md`.

**Tech Stack:** TypeScript (ESM), Node.js (>=18), TypeScript Compiler API (`typescript`), `commander` (CLI), `chalk` & `ora` (terminal UI), `vitest` (TDD unit & integration tests).

**Spec:** `docs/superpowers/specs/2026-10-03-semvibe-commercial-architecture.md`

## Global Constraints
- **Language & Runtime:** TypeScript strictly typed (`strict: true`), ESM modules (`"type": "module"`).
- **Zero Token Baseline:** AST extraction, clustering, and rule export must run completely offline without tokens.
- **Precision First:** Optimize for low false-positive rate (target >80% precision); never invent invariants when distribution is fragmented (e.g. <75% dominance).
- **No Hallucinated Configs:** Invariants are discovered dynamically from code, saved to `.semvibe/invariants.json`.

## Review Focus
1. **Empty / Tiny Codebases:** Codebase with fewer than 3 files or no clear patterns must not crash or output garbage invariants; should warn gracefully.
2. **Syntax Errors in Scanned Code:** Unparseable user files must be logged as warnings without halting the entire scan.
3. **High Pattern Fragmentation:** When code has a 40/35/25 split in error handling, the engine must flag "Unresolved Style Divergence" instead of marking 60% of files as errors.
4. **Offline / Missing LLM Key:** When running `semvibe scan --ast-only` or when no LLM key is configured, fallback smoothly to pure AST outlier reporting.
5. **Idempotent Rules Export:** `semvibe export-rules` must safely insert or update the `<!-- SEMVIBE:START -->` / `<!-- SEMVIBE:END -->` block in existing `.cursorrules` or `CLAUDE.md` without overwriting existing user instructions.

---

### Task 1: Test Suite & Infrastructure Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Consumes: Node.js, npm
- Produces: Working `npm test` script executing Vitest in ESM mode

- [ ] **Step 1: Write failing smoke test**
```typescript
// tests/setup.test.ts
import { describe, it, expect } from "vitest";

describe("Semvibe Test Infrastructure", () => {
  it("executes vitest correctly in TypeScript ESM mode", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (vitest not installed yet)**
Run: `npm test`
Expected: FAIL (missing vitest / test command)

- [ ] **Step 3: Install vitest devDependency and update package.json**
Add `"vitest": "^1.6.0"` to devDependencies, add `"test": "vitest run"`.
Create `vitest.config.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**
```bash
git add package.json vitest.config.ts tests/setup.test.ts
git commit -m "chore: setup vitest testing framework"
```

---

### Task 2: TypeScript AST Extractor

**Files:**
- Create: `src/core/extractor.ts`
- Create: `src/core/types.ts`
- Test: `tests/core/extractor.test.ts`

**Interfaces:**
- Consumes: Source file paths + code content
- Produces: `FileSignature`
  - `filePath: string`
  - `imports: { source: string; isExternal: boolean; specifiers: string[] }[]`
  - `errorHandling: { throws: number; returnsResult: number; tryCatchBlocks: number }`
  - `layer: "component" | "controller" | "service" | "db" | "util" | "unknown"`

- [ ] **Step 1: Write failing tests for AST extraction**
```typescript
// tests/core/extractor.test.ts
import { describe, it, expect } from "vitest";
import { extractFileSignature } from "../../src/core/extractor.js";

describe("AST Extractor", () => {
  it("extracts imports, error handling and layer from service file", () => {
    const code = `
      import axios from "axios";
      import { db } from "../db/client";

      export async function getUser(id: string) {
        if (!id) throw new Error("ID required");
        return db.users.find(id);
      }
    `;
    const sig = extractFileSignature("src/services/userService.ts", code);
    expect(sig.layer).toBe("service");
    expect(sig.imports).toHaveLength(2);
    expect(sig.imports[0].isExternal).toBe(true);
    expect(sig.imports[1].isExternal).toBe(false);
    expect(sig.errorHandling.throws).toBe(1);
    expect(sig.errorHandling.returnsResult).toBe(0);
  });

  it("detects Result<T, E> return patterns", () => {
    const code = `
      export function parseData(): Result<Data, ParseError> {
        return ok({ valid: true });
      }
    `;
    const sig = extractFileSignature("src/services/parser.ts", code);
    expect(sig.errorHandling.returnsResult).toBe(1);
    expect(sig.errorHandling.throws).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/extractor.test.ts`
Expected: FAIL (cannot find module `src/core/extractor.js`)

- [ ] **Step 3: Implement `types.ts` and `extractFileSignature` using TypeScript Compiler API (`ts.createSourceFile`)**
Parse imports (External package vs relative local path).
Inspect function declarations, methods, and return statements for `throw`, `Result`, `ok(`, `err(`.
Classify layer based on file path conventions (`components/`, `services/`, `controllers/`, `routes/`, `db/`).

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/extractor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/types.ts src/core/extractor.ts tests/core/extractor.test.ts
git commit -m "feat(core): implement AST feature extractor for TypeScript files"
```

---

### Task 3: Invariant Discovery & Statistical Clustering

**Files:**
- Create: `src/core/invariants.ts`
- Test: `tests/core/invariants.test.ts`

**Interfaces:**
- Consumes: `FileSignature[]`
- Produces: `InvariantDiscoveryResult`
  - `dominantInvariants: Invariant[]`
  - `unresolvedDivergences: Divergence[]`

- [ ] **Step 1: Write failing tests for statistical invariant clustering**
```typescript
// tests/core/invariants.test.ts
import { describe, it, expect } from "vitest";
import { discoverInvariants } from "../../src/core/invariants.js";
import { FileSignature } from "../../src/core/types.js";

describe("Invariant Discovery", () => {
  it("discovers dominant error handling pattern when dominance >= 75%", () => {
    const signatures: FileSignature[] = [
      { filePath: "src/services/a.ts", layer: "service", imports: [], errorHandling: { throws: 0, returnsResult: 2, tryCatchBlocks: 0 } },
      { filePath: "src/services/b.ts", layer: "service", imports: [], errorHandling: { throws: 0, returnsResult: 1, tryCatchBlocks: 0 } },
      { filePath: "src/services/c.ts", layer: "service", imports: [], errorHandling: { throws: 0, returnsResult: 3, tryCatchBlocks: 0 } },
      { filePath: "src/services/d.ts", layer: "service", imports: [], errorHandling: { throws: 1, returnsResult: 0, tryCatchBlocks: 0 } },
    ];
    const result = discoverInvariants(signatures, { dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(1);
    expect(result.dominantInvariants[0].type).toBe("error-handling");
    expect(result.dominantInvariants[0].dominantPattern).toBe("result-pattern");
    expect(result.dominantInvariants[0].confidence).toBe(0.75);
    expect(result.unresolvedDivergences).toHaveLength(0);
  });

  it("detects unresolved divergence when distribution is split without clear winner", () => {
    const signatures: FileSignature[] = [
      { filePath: "src/services/a.ts", layer: "service", imports: [], errorHandling: { throws: 1, returnsResult: 0, tryCatchBlocks: 0 } },
      { filePath: "src/services/b.ts", layer: "service", imports: [], errorHandling: { throws: 0, returnsResult: 1, tryCatchBlocks: 0 } },
    ];
    const result = discoverInvariants(signatures, { dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(0);
    expect(result.unresolvedDivergences).toHaveLength(1);
    expect(result.unresolvedDivergences[0].type).toBe("error-handling");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/invariants.test.ts`
Expected: FAIL (`discoverInvariants` not defined)

- [ ] **Step 3: Implement `discoverInvariants` algorithm**
Compute cluster counts for:
1. Error handling strategy per layer.
2. Layer boundary imports (e.g. whether services ever import UI components).
3. Primary HTTP/State/Validation libraries used across the project.
If ratio >= threshold (default 75%), emit `dominantInvariant`.
If ratio < threshold and multiple patterns present, emit `unresolvedDivergence`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/invariants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/invariants.ts tests/core/invariants.test.ts
git commit -m "feat(core): implement invariant discovery and divergence detector"
```

---

### Task 4: Outlier & Anomaly Detection

**Files:**
- Create: `src/core/outliers.ts`
- Test: `tests/core/outliers.test.ts`

**Interfaces:**
- Consumes: `FileSignature[]`, `Invariant[]`
- Produces: `Outlier[]`
  - `filePath: string`
  - `ruleId: string`
  - `violation: string`
  - `expected: string`
  - `confidence: number`

- [ ] **Step 1: Write failing test for detecting outliers against invariants**
```typescript
// tests/core/outliers.test.ts
import { describe, it, expect } from "vitest";
import { detectOutliers } from "../../src/core/outliers.js";
import { FileSignature, Invariant } from "../../src/core/types.js";

describe("Outlier Detection", () => {
  it("flags files that violate dominant invariant", () => {
    const invariants: Invariant[] = [{
      id: "inv-err-services",
      type: "error-handling",
      layer: "service",
      dominantPattern: "result-pattern",
      description: "Services must return Result<T, E>",
      confidence: 0.9,
    }];
    const signatures: FileSignature[] = [
      { filePath: "src/services/good.ts", layer: "service", imports: [], errorHandling: { throws: 0, returnsResult: 2, tryCatchBlocks: 0 } },
      { filePath: "src/services/bad.ts", layer: "service", imports: [], errorHandling: { throws: 1, returnsResult: 0, tryCatchBlocks: 0 } },
    ];
    const outliers = detectOutliers(signatures, invariants);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].filePath).toBe("src/services/bad.ts");
    expect(outliers[0].ruleId).toBe("inv-err-services");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/outliers.test.ts`
Expected: FAIL (`detectOutliers` not defined)

- [ ] **Step 3: Implement `detectOutliers`**
Matches file signatures against active invariants. Emits candidate outliers with severity and contextual details.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/outliers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/outliers.ts tests/core/outliers.test.ts
git commit -m "feat(core): implement candidate outlier detection engine"
```

---

### Task 5: Targeted Semantic LLM Verifier

**Files:**
- Create: `src/core/verifier.ts`
- Test: `tests/core/verifier.test.ts`

**Interfaces:**
- Consumes: `Outlier`, source code of outlier, invariant description
- Produces: `VerifiedViolation`
  - `isTruePositive: boolean`
  - `reasoning: string`
  - `suggestedRemediation: string`

- [ ] **Step 1: Write failing test with mock LLM client**
```typescript
// tests/core/verifier.test.ts
import { describe, it, expect } from "vitest";
import { verifyOutlierWithLLM } from "../../src/core/verifier.js";

describe("Semantic LLM Verifier", () => {
  it("filters false positives when LLM determines outlier is an intentional exception", async () => {
    const mockClient = {
      complete: async () => JSON.stringify({
        isTruePositive: false,
        reasoning: "This file is a test helper, so throwing raw errors is acceptable.",
        suggestedRemediation: ""
      })
    };
    const result = await verifyOutlierWithLLM(
      { filePath: "tests/helpers/throw.ts", ruleId: "inv-err", violation: "Throws error", expected: "Result", confidence: 0.9 },
      "function fail() { throw new Error(); }",
      "Services should return Result",
      mockClient
    );
    expect(result.isTruePositive).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/verifier.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `verifyOutlierWithLLM`**
Supports pluggable completion client (Anthropic / Ollama / OpenAI-compatible / Mock).
Constructs compact prompt with invariant rule + outlier code.
Parses JSON response and returns `VerifiedViolation`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/verifier.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/verifier.ts tests/core/verifier.test.ts
git commit -m "feat(core): implement targeted LLM semantic verifier"
```

---

### Task 6: Rules Exporter (`CLAUDE.md`, `.cursorrules`, `.windsurfrules`)

**Files:**
- Create: `src/core/exporter.ts`
- Test: `tests/core/exporter.test.ts`

**Interfaces:**
- Consumes: `Invariant[]`, target directory
- Produces: Updated `.cursorrules` / `CLAUDE.md` containing delimited Semvibe architectural rules

- [ ] **Step 1: Write failing test for rules export**
```typescript
// tests/core/exporter.test.ts
import { describe, it, expect } from "vitest";
import { generateRulesMarkdown, syncRulesToFile } from "../../src/core/exporter.js";
import { Invariant } from "../../src/core/types.js";

describe("Rules Exporter", () => {
  it("formats invariants into clear markdown block", () => {
    const invariants: Invariant[] = [{
      id: "inv-1",
      type: "error-handling",
      dominantPattern: "Result<T, E>",
      description: "All services in src/services must return Result<T, E>",
      confidence: 0.95
    }];
    const md = generateRulesMarkdown(invariants);
    expect(md).toContain("<!-- SEMVIBE:START -->");
    expect(md).toContain("All services in src/services must return Result<T, E>");
    expect(md).toContain("<!-- SEMVIBE:END -->");
  });

  it("updates existing file between markers without erasing other user instructions", () => {
    const existing = "# My Custom Instructions\n\n<!-- SEMVIBE:START -->\nOld rules\n<!-- SEMVIBE:END -->\n\nOther notes";
    const updated = syncRulesToFile(existing, "New rules");
    expect(updated).toContain("# My Custom Instructions");
    expect(updated).toContain("New rules");
    expect(updated).not.toContain("Old rules");
    expect(updated).toContain("Other notes");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/exporter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `generateRulesMarkdown` and `syncRulesToFile`**
Inserts or updates delimited Semvibe section. Handles creating files if they do not exist.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/exporter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/exporter.ts tests/core/exporter.test.ts
git commit -m "feat(core): implement rules exporter for cursorrules and CLAUDE.md"
```

---

### Task 7: CLI Commands & Terminal UI Integration

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/reporter.ts`
- Create: `tests/integration/cli.test.ts`

**Interfaces:**
- Consumes: Commander CLI options
- Produces:
  - `semvibe learn [dir]`
  - `semvibe scan [dir]`
  - `semvibe export-rules [dir]`

- [ ] **Step 1: Write integration test for CLI scan and learn commands**
```typescript
// tests/integration/cli.test.ts
import { describe, it, expect } from "vitest";
import { runScanPipeline, runLearnPipeline } from "../../src/core/pipeline.js";

describe("Semvibe CLI Pipeline Integration", () => {
  it("runs learn and scan pipeline against sample project", async () => {
    const learnResult = await runLearnPipeline("src");
    expect(learnResult).toBeDefined();
    const scanResult = await runScanPipeline("src", { astOnly: true });
    expect(scanResult.outliers).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/integration/cli.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/core/pipeline.ts`, wire up `src/cli.ts` and `src/reporter.ts`**
Add commands `learn`, `scan`, `export-rules` in `cli.ts`.
Connect terminal reporter with clean tables, confidence scores, and instructions.

- [ ] **Step 4: Run all tests and build project**
Run: `npm test && npm run build`
Expected: PASS (all unit and integration tests passing, tsc builds cleanly)

- [ ] **Step 5: Commit**
```bash
git add src/cli.ts src/reporter.ts src/core/pipeline.ts tests/integration/cli.test.ts
git commit -m "feat(cli): complete Phase 1 CLI commands learn, scan, and export-rules"
```
