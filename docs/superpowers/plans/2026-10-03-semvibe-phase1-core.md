# Semvibe Phase 1 (Lean Core MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Semvibe Phase 1 Lean Core MVP: robust TypeScript file scanner with `.gitignore`, enhanced AST feature extractor, statistical invariant clustering with minimum sample thresholds, targeted LLM semantic verification, modern agent rules exporter (`AGENTS.md` & `CLAUDE.md`), interactive CLI (`learn`, `scan`, `export-rules`), and an automated Benchmark Runner for precision validation against competitors.

**Architecture:** A two-phase hybrid engine:
1. Fast AST & Call Extractor (0 tokens) scans TypeScript codebases, extracting function-level error handling (`throw`, `Result`, `{ success: false }`), global calls (e.g. `fetch()`), layer roles, and dependency roles (HTTP/Validation/State).
2. Statistical Invariant Learner clusters patterns with a minimum sample size threshold (≥5 functions) and dominance threshold (≥75%). Divergences are flagged as unresolved style splits.
3. Targeted LLM Verifier tests only statistical outliers against positive repository examples.
4. Rules Exporter compiles verified invariants into modern agent guidelines (`AGENTS.md`, `CLAUDE.md`).
5. Benchmark Runner tests the pipeline against real-world repos to prove Precision ≥80% before Phase 2 investment.

**Tech Stack:** Node.js (>=20), TypeScript 5+ (ESM), TypeScript Compiler API (`typescript`), `vitest` (2.x), `commander`, `chalk`, `ora`, `glob`, `ignore`.

**Spec:** `docs/superpowers/specs/2026-10-03-semvibe-commercial-architecture.md`

## Global Constraints
- **Runtime:** Node.js `>=20.0.0`, `"type": "module"`.
- **Zero Token Core:** Scanner, AST extraction, clustering, and rule export must run 100% offline without any API keys.
- **Strict Dominance Threshold:** Dominance threshold is strictly `>= 75%`. Sample size must be `>= 5` instances to declare an invariant.
- **Standard Agent Formats:** Primary rule targets are `AGENTS.md` and `CLAUDE.md` (cross-tool standards supported by Cursor, Windsurf, Claude Code, Copilot, Antigravity).
- **Graceful Error Handling:** Syntax errors in scanned files must produce logged warnings and partial parse skip, never a process crash.

## Review Focus
1. **Unparseable / Syntax-Broken Files:** TypeScript files with parse errors must be caught and skipped with a warning; must not produce corrupted signatures.
2. **Small / Low-Sample Repositories (<5 functions per layer):** Must not invent false invariants; must report "Insufficient sample size to establish invariants" instead of flagging 1-2 files.
3. **Global Calls Detection:** Must catch global `fetch()` calls even when no `import ... from '...'` statement is present.
4. **Offline / Missing LLM Key Fallback:** `semvibe scan` must run cleanly with `--ast-only` or when no LLM key is set, outputting candidate AST outliers.
5. **Idempotent Rules Injection:** Preserves all existing instructions in `AGENTS.md` or `CLAUDE.md`, only modifying between `<!-- SEMVIBE:START -->` and `<!-- SEMVIBE:END -->`.

---

### Task 0: Project Scaffolding & Robust File Scanner

**Files:**
- Create: `src/core/scanner.ts`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Test: `tests/core/scanner.test.ts`

**Interfaces:**
- Consumes: Target directory path
- Produces: `ScannedFile[]`
  - `path: string` (relative)
  - `content: string`
  - `lines: number`

- [ ] **Step 1: Write failing tests for scanner with `.gitignore` and exclusion filters**
```typescript
// tests/core/scanner.test.ts
import { describe, it, expect } from "vitest";
import { scanCodebase } from "../../src/core/scanner.js";
import { resolve } from "path";

describe("Scanner", () => {
  it("ignores node_modules, dist, tests, mocks and d.ts files", async () => {
    const files = await scanCodebase(resolve("."));
    const paths = files.map(f => f.path);
    expect(paths.some(p => p.includes("node_modules"))).toBe(false);
    expect(paths.some(p => p.includes("dist/"))).toBe(false);
    expect(paths.some(p => p.endsWith(".test.ts"))).toBe(false);
    expect(paths.some(p => p.endsWith(".d.ts"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/scanner.test.ts`
Expected: FAIL (`scanCodebase` not defined)

- [ ] **Step 3: Implement `src/core/scanner.ts` and update `package.json` / `tsconfig.json`**
Add dependencies: `ignore`, `glob`.
Update `tsconfig.json` for Node20 ESM resolution.
Filter out tests (`*.test.*`, `*.spec.*`, `__tests__`), mocks (`*.mock.*`), declarations (`*.d.ts`), build outputs (`dist/`, `build/`).
Respect `.gitignore` if present.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/scanner.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json src/core/scanner.ts tests/core/scanner.test.ts
git commit -m "feat(core): implement robust scanner with gitignore and test exclusions"
```

---

### Task 1: Vitest 2.x Testing Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Consumes: npm
- Produces: Working test pipeline with TypeScript ESM support

- [ ] **Step 1: Write smoke test**
```typescript
// tests/setup.test.ts
import { describe, it, expect } from "vitest";

describe("Test Infrastructure", () => {
  it("runs vitest in Node 20 ESM environment", () => {
    expect(process.version.startsWith("v2")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/setup.test.ts`
Expected: FAIL (vitest not installed)

- [ ] **Step 3: Install `vitest` and configure `vitest.config.ts`**
Run `npm install -D vitest` and configure `test` script in `package.json`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/setup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json vitest.config.ts tests/setup.test.ts
git commit -m "chore: configure vitest 2.x test runner"
```

---

### Task 2: Enhanced AST Extractor & Domain Types

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/extractor.ts`
- Test: `tests/core/extractor.test.ts`

**Interfaces:**
- Consumes: Source code string + file path
- Produces: `FileSignature`
  - `filePath: string`
  - `layer: "component" | "controller" | "service" | "db" | "util" | "unknown"`
  - `imports: ImportSignature[]`
  - `globalCalls: string[]` (e.g. `fetch`, `axios`)
  - `functions: FunctionSignature[]`
    - `name: string`
    - `line: number`
    - `errorStrategy: "throw" | "result-pattern" | "success-boolean" | "error-object" | "none"`

- [ ] **Step 1: Write failing tests for function-level error schemas and global call detection**
```typescript
// tests/core/extractor.test.ts
import { describe, it, expect } from "vitest";
import { extractFileSignature, PACKAGE_ROLES } from "../../src/core/extractor.js";

describe("Enhanced AST Extractor", () => {
  it("detects global fetch calls without imports", () => {
    const code = `
      export async function loadUsers() {
        const res = await fetch("https://api.example.com");
        return res.json();
      }
    `;
    const sig = extractFileSignature("src/services/api.service.ts", code);
    expect(sig.globalCalls).toContain("fetch");
    expect(sig.layer).toBe("service");
  });

  it("classifies error handling per function (throw vs Result vs { success: false })", () => {
    const code = `
      export function parseA() { throw new Error("A failed"); }
      export function parseB(): Result<string, Error> { return ok("B"); }
      export function parseC() { return { success: false, error: "C failed" }; }
    `;
    const sig = extractFileSignature("src/services/parsers.ts", code);
    expect(sig.functions).toHaveLength(3);
    expect(sig.functions[0].errorStrategy).toBe("throw");
    expect(sig.functions[1].errorStrategy).toBe("result-pattern");
    expect(sig.functions[2].errorStrategy).toBe("success-boolean");
  });

  it("handles syntax errors gracefully without throwing", () => {
    const brokenCode = `export function broken( {`;
    const sig = extractFileSignature("src/broken.ts", brokenCode);
    expect(sig).toBeDefined();
    expect(sig.hasParseErrors).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/extractor.test.ts`
Expected: FAIL (`extractFileSignature` not defined)

- [ ] **Step 3: Implement `types.ts` and `extractor.ts` using TypeScript AST**
Define `PACKAGE_ROLES` dictionary (HTTP: `axios`, `got`, `node-fetch`, `ky`, `undici`; Validator: `zod`, `yup`, `joi`, `valibot`; State: `zustand`, `redux`, `mobx`, `jotai`).
Inspect AST nodes for `CallExpression` to identify global calls (`fetch`).
Inspect functions/methods/arrow functions: check return expressions for `{ success: false }`, `{ error: ... }`, `ok(`, `err(`, and `throw` statements.
Infer layer from file suffix (`.service.ts`, `.controller.ts`, `.route.ts`) and path.
Handle `ts.getPreEmitDiagnostics` to flag `hasParseErrors`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/extractor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/types.ts src/core/extractor.ts tests/core/extractor.test.ts
git commit -m "feat(core): implement enhanced AST extractor with global calls and error schemas"
```

---

### Task 3: Statistical Invariant Clustering & Divergence Detector

**Files:**
- Create: `src/core/invariants.ts`
- Test: `tests/core/invariants.test.ts`

**Interfaces:**
- Consumes: `FileSignature[]`, `options: { dominanceThreshold?: number, minSampleSize?: number }`
- Produces: `InvariantDiscoveryResult`
  - `dominantInvariants: Invariant[]`
  - `unresolvedDivergences: Divergence[]`

- [ ] **Step 1: Write failing tests with sample size and threshold checks**
```typescript
// tests/core/invariants.test.ts
import { describe, it, expect } from "vitest";
import { discoverInvariants } from "../../src/core/invariants.js";
import { FileSignature } from "../../src/core/types.js";

describe("Invariant Discovery", () => {
  it("enforces minimum sample size threshold (>= 5 functions)", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/a.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [{ name: "fn1", line: 1, errorStrategy: "throw" }],
        hasParseErrors: false
      }
    ];
    const result = discoverInvariants(signatures, { minSampleSize: 5 });
    expect(result.dominantInvariants).toHaveLength(0);
    expect(result.insufficientSampleWarnings).toBeDefined();
  });

  it("establishes invariant when sample size >= 5 and dominance >= 75%", () => {
    const fns = [
      { name: "f1", line: 1, errorStrategy: "result-pattern" as const },
      { name: "f2", line: 5, errorStrategy: "result-pattern" as const },
      { name: "f3", line: 10, errorStrategy: "result-pattern" as const },
      { name: "f4", line: 15, errorStrategy: "result-pattern" as const },
      { name: "f5", line: 20, errorStrategy: "throw" as const },
    ];
    const signatures: FileSignature[] = [{
      filePath: "src/services/users.service.ts",
      layer: "service",
      imports: [],
      globalCalls: [],
      functions: fns,
      hasParseErrors: false
    }];
    const result = discoverInvariants(signatures, { minSampleSize: 5, dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(1);
    expect(result.dominantInvariants[0].dominantPattern).toBe("result-pattern");
    expect(result.dominantInvariants[0].confidence).toBe(0.8);
  });

  it("flags unresolved divergence when split is high (e.g. 50/50)", () => {
    const fns = [
      { name: "f1", line: 1, errorStrategy: "throw" as const },
      { name: "f2", line: 5, errorStrategy: "throw" as const },
      { name: "f3", line: 10, errorStrategy: "throw" as const },
      { name: "f4", line: 15, errorStrategy: "result-pattern" as const },
      { name: "f5", line: 20, errorStrategy: "result-pattern" as const },
      { name: "f6", line: 25, errorStrategy: "result-pattern" as const },
    ];
    const signatures: FileSignature[] = [{
      filePath: "src/services/split.service.ts",
      layer: "service",
      imports: [],
      globalCalls: [],
      functions: fns,
      hasParseErrors: false
    }];
    const result = discoverInvariants(signatures, { minSampleSize: 5, dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(0);
    expect(result.unresolvedDivergences).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/invariants.test.ts`
Expected: FAIL (`discoverInvariants` not defined)

- [ ] **Step 3: Implement invariant discovery clustering**
Cluster across:
1. Error strategy per layer.
2. HTTP client / Library roles across files.
3. Layer import permissions.
Enforce `minSampleSize = 5` and `dominanceThreshold = 0.75`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/invariants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/invariants.ts tests/core/invariants.test.ts
git commit -m "feat(core): implement statistical invariant clustering with sample thresholds"
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
  - `functionName: string`
  - `line: number`
  - `ruleId: string`
  - `observed: string`
  - `expected: string`
  - `codeSnippet: string`

- [ ] **Step 1: Write failing test for detecting outliers**
```typescript
// tests/core/outliers.test.ts
import { describe, it, expect } from "vitest";
import { detectOutliers } from "../../src/core/outliers.js";
import { Invariant, FileSignature } from "../../src/core/types.js";

describe("Outlier Detector", () => {
  it("detects functions violating the dominant invariant", () => {
    const invariant: Invariant = {
      id: "inv-service-error",
      type: "error-handling",
      layer: "service",
      dominantPattern: "result-pattern",
      description: "Services must return Result<T, E>",
      confidence: 0.85,
      sampleSize: 10
    };
    const signature: FileSignature = {
      filePath: "src/services/rogue.service.ts",
      layer: "service",
      imports: [],
      globalCalls: [],
      functions: [
        { name: "normalFn", line: 5, errorStrategy: "result-pattern" },
        { name: "rogueFn", line: 20, errorStrategy: "throw" }
      ],
      hasParseErrors: false
    };
    const outliers = detectOutliers([signature], [invariant]);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].functionName).toBe("rogueFn");
    expect(outliers[0].line).toBe(20);
    expect(outliers[0].expected).toBe("result-pattern");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/outliers.test.ts`
Expected: FAIL (`detectOutliers` not defined)

- [ ] **Step 3: Implement `detectOutliers`**
Compare signatures against active invariants. Collect matching positive examples for each invariant to aid semantic verification.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/outliers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/outliers.ts tests/core/outliers.test.ts
git commit -m "feat(core): implement candidate outlier detection engine"
```

---

### Task 5: Targeted Semantic LLM Verifier (with Positive Exemplars)

**Files:**
- Create: `src/core/verifier.ts`
- Test: `tests/core/verifier.test.ts`

**Interfaces:**
- Consumes: `Outlier`, outlier code snippet, positive repository example, optional LLM client
- Produces: `VerifiedViolation`
  - `isTruePositive: boolean`
  - `confidence: number`
  - `reasoning: string`
  - `suggestedRemediation: string`

- [ ] **Step 1: Write failing test with mock LLM client and exemplar context**
```typescript
// tests/core/verifier.test.ts
import { describe, it, expect } from "vitest";
import { verifyOutlier } from "../../src/core/verifier.js";

describe("Targeted Semantic Verifier", () => {
  it("verifies true violation when code clearly violates standard", async () => {
    const mockClient = {
      complete: async () => JSON.stringify({
        isTruePositive: true,
        confidence: 0.95,
        reasoning: "The function throws a raw Error instead of returning Result<T, E> like standard service methods.",
        suggestedRemediation: "Refactor to return Result.err(new AppError(...))"
      })
    };
    const res = await verifyOutlier(
      {
        filePath: "src/services/user.service.ts",
        functionName: "getUser",
        line: 15,
        ruleId: "inv-err",
        observed: "throw",
        expected: "result-pattern",
        codeSnippet: "function getUser() { throw new Error(); }"
      },
      "function goodUser(): Result<User, Error> { return ok(user); }",
      mockClient
    );
    expect(res.isTruePositive).toBe(true);
    expect(res.suggestedRemediation).toContain("Result.err");
  });

  it("falls back to AST finding when LLM is unavailable or offline", async () => {
    const res = await verifyOutlier(
      {
        filePath: "src/services/user.service.ts",
        functionName: "getUser",
        line: 15,
        ruleId: "inv-err",
        observed: "throw",
        expected: "result-pattern",
        codeSnippet: "function getUser() { throw new Error(); }"
      },
      undefined,
      undefined // No LLM client
    );
    expect(res.isTruePositive).toBe(true);
    expect(res.reasoning).toContain("AST-only mode");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/verifier.test.ts`
Expected: FAIL (`verifyOutlier` not defined)

- [ ] **Step 3: Implement `verifyOutlier` with Anthropic API / Ollama / OpenAI adapter**
Build structured prompt containing:
1. Active Invariant Rule
2. Exemplary Code Snippet from the repository (the "gold standard")
3. Outlier Code Snippet
Handle JSON parse errors and network timeouts with graceful fallback to AST verdict.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/verifier.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/verifier.ts tests/core/verifier.test.ts
git commit -m "feat(core): implement semantic LLM verifier with exemplar prompts and offline fallback"
```

---

### Task 6: Modern Agent Rules Exporter (`AGENTS.md` & `CLAUDE.md`)

**Files:**
- Create: `src/core/exporter.ts`
- Test: `tests/core/exporter.test.ts`

**Interfaces:**
- Consumes: `Invariant[]`, target directory path
- Produces: Updated `AGENTS.md` and/or `CLAUDE.md`

- [ ] **Step 1: Write failing tests for idempotent rules sync**
```typescript
// tests/core/exporter.test.ts
import { describe, it, expect } from "vitest";
import { formatRulesMarkdown, syncRulesIntoFile } from "../../src/core/exporter.js";
import { Invariant } from "../../src/core/types.js";

describe("Agent Rules Exporter", () => {
  it("formats invariants into clean Markdown rules", () => {
    const invariants: Invariant[] = [{
      id: "inv-1",
      type: "error-handling",
      layer: "service",
      dominantPattern: "result-pattern",
      description: "All services must return Result<T, AppError>",
      confidence: 0.9,
      sampleSize: 8
    }];
    const md = formatRulesMarkdown(invariants);
    expect(md).toContain("<!-- SEMVIBE:START -->");
    expect(md).toContain("### Architectural Invariants (Enforced by Semvibe)");
    expect(md).toContain("All services must return Result<T, AppError>");
    expect(md).toContain("<!-- SEMVIBE:END -->");
  });

  it("updates rules between markers in existing file without deleting user notes", () => {
    const original = "# Project Rules\nDo not use any.\n\n<!-- SEMVIBE:START -->\nOld\n<!-- SEMVIBE:END -->\n\nKeep this!";
    const result = syncRulesIntoFile(original, "New Rule Content");
    expect(result).toContain("# Project Rules");
    expect(result).toContain("New Rule Content");
    expect(result).not.toContain("Old");
    expect(result).toContain("Keep this!");
  });

  it("appends rules with markers when file exists without markers", () => {
    const original = "# Project Rules\nExisting text.";
    const result = syncRulesIntoFile(original, "New Rule Content");
    expect(result).toContain("Existing text.");
    expect(result).toContain("<!-- SEMVIBE:START -->\nNew Rule Content\n<!-- SEMVIBE:END -->");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/core/exporter.test.ts`
Expected: FAIL (`formatRulesMarkdown` not defined)

- [ ] **Step 3: Implement `formatRulesMarkdown` and `syncRulesIntoFile`**
Target primary files: `AGENTS.md` and `CLAUDE.md` (and optionally `.cursor/rules/architecture.mdc`).

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/core/exporter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/exporter.ts tests/core/exporter.test.ts
git commit -m "feat(core): implement modern agent rules exporter for AGENTS.md and CLAUDE.md"
```

---

### Task 7: CLI Commands & Interactive Terminal UI

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/reporter.ts`
- Create: `src/core/pipeline.ts`
- Test: `tests/integration/cli.test.ts`

**Interfaces:**
- Consumes: User command invocations:
  - `semvibe learn [dir]`
  - `semvibe scan [dir] [--ast-only]`
  - `semvibe export-rules [dir]`
- Produces: Terminal UI output and `.semvibe/invariants.json`

- [ ] **Step 1: Write integration tests with a fixture repository**
```typescript
// tests/integration/cli.test.ts
import { describe, it, expect } from "vitest";
import { runLearn, runScan, runExportRules } from "../../src/core/pipeline.js";
import { resolve } from "path";

describe("CLI Pipelines", () => {
  it("runs learn pipeline and extracts candidate invariants", async () => {
    const res = await runLearn(resolve("tests/fixtures/sample-repo"));
    expect(res.invariants).toBeDefined();
  });

  it("runs scan pipeline and flags known violations", async () => {
    const res = await runScan(resolve("tests/fixtures/sample-repo"), { astOnly: true });
    expect(res.violations.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/integration/cli.test.ts`
Expected: FAIL

- [ ] **Step 3: Create fixture repo and implement `src/core/pipeline.ts`, `src/cli.ts`, and `src/reporter.ts`**
Create `tests/fixtures/sample-repo` with 5 standard service files returning `Result` and 1 rogue file throwing raw error.
Implement interactive confirmation prompt for `learn` (`Save to .semvibe/invariants.json?`).
Wire up colorful terminal reporting with Ora spinners and Chalk tables.

- [ ] **Step 4: Run test and verify it passes**
Run: `npm test tests/integration/cli.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/cli.ts src/reporter.ts src/core/pipeline.ts tests/fixtures/ tests/integration/cli.test.ts
git commit -m "feat(cli): complete CLI suite for learn, scan, and export-rules"
```

---

### Task 8: Evaluation Benchmark Runner & Go/No-Go Gate

**Files:**
- Create: `scripts/benchmark.ts`
- Create: `tests/benchmark/dataset.json`
- Test: `tests/benchmark/eval.test.ts`

**Interfaces:**
- Consumes: 5 open-source repository slices + 50 manually labeled ground-truth findings
- Produces: Benchmark evaluation report:
  - `precision: number` (Target: ≥ 80%)
  - `recall: number`
  - `tokenSavingsVsFullLLM: string`
  - `comparisonVsDrift: string`

- [ ] **Step 1: Create labeled benchmark dataset (`tests/benchmark/dataset.json`)**
50 ground-truth samples (30 genuine violations, 20 intentional exceptions across real TypeScript codebases).

- [ ] **Step 2: Write evaluation test asserting Precision ≥ 80%**
```typescript
// tests/benchmark/eval.test.ts
import { describe, it, expect } from "vitest";
import { runBenchmarkSuite } from "../../scripts/benchmark.js";

describe("Phase 1 Quality Gate Benchmark", () => {
  it("achieves Precision >= 80% on labeled architectural findings", async () => {
    const report = await runBenchmarkSuite();
    console.log("Benchmark Summary:", report);
    expect(report.precision).toBeGreaterThanOrEqual(0.80);
  });
});
```

- [ ] **Step 3: Implement `scripts/benchmark.ts`**
Runs Semvibe AST + LLM on dataset. Computes True Positives, False Positives, False Negatives, Precision, and Recall.

- [ ] **Step 4: Run benchmark and verify gate passes**
Run: `npm test tests/benchmark/eval.test.ts`
Expected: PASS (Precision ≥ 80%)

- [ ] **Step 5: Commit and record results**
```bash
git add scripts/benchmark.ts tests/benchmark/
git commit -m "test(benchmark): implement benchmark runner and verify precision gate >= 80%"
```
