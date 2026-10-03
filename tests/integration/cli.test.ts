import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runLearn, runScan, runExportRules } from "../../src/core/pipeline.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve, join } from "path";

describe("Semvibe CLI Integration Pipelines", () => {
  const fixtureDir = resolve("tests/fixtures/integration-repo");

  beforeAll(() => {
    if (existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true });
    mkdirSync(join(fixtureDir, "src/services"), { recursive: true });

    // 5 conforming service files returning Result
    for (let i = 1; i <= 5; i++) {
      writeFileSync(
        join(fixtureDir, `src/services/service${i}.service.ts`),
        `
        import axios from "axios";
        export function operation${i}(): Result<string, Error> {
          return ok("done ${i}");
        }
        `
      );
    }

    // 1 rogue service file throwing raw Error and using native fetch
    writeFileSync(
      join(fixtureDir, "src/services/rogue.service.ts"),
      `
      export function rogueOperation() {
        fetch("https://rogue-api.com");
        throw new Error("unhandled rogue error");
      }
      `
    );
  });

  afterAll(() => {
    if (existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("learns dominant invariants from conforming services", async () => {
    const learnResult = await runLearn(fixtureDir, { autoConfirm: true });
    expect(learnResult.invariants.length).toBeGreaterThanOrEqual(1);

    const errorInv = learnResult.invariants.find(i => i.type === "error-handling");
    expect(errorInv).toBeDefined();
    expect(errorInv?.dominantPattern).toBe("result-pattern");

    // Invariants file should be persisted
    expect(existsSync(join(fixtureDir, ".semvibe/invariants.json"))).toBe(true);
  });

  it("scans repository and flags the rogue service violations in AST-only mode", async () => {
    const scanResult = await runScan(fixtureDir, { astOnly: true });
    expect(scanResult.violations.length).toBeGreaterThanOrEqual(1);

    const rogueViolation = scanResult.violations.find(v => v.outlier.filePath.includes("rogue.service.ts"));
    expect(rogueViolation).toBeDefined();
    expect(rogueViolation?.outlier.observed).toBe("throw");
    expect(rogueViolation?.outlier.expected).toBe("result-pattern");
  });

  it("exports verified invariants into AGENTS.md and CLAUDE.md", async () => {
    const exportResult = await runExportRules(fixtureDir);
    expect(exportResult.modifiedFiles).toContain("AGENTS.md");
    expect(exportResult.modifiedFiles).toContain("CLAUDE.md");

    expect(existsSync(join(fixtureDir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(fixtureDir, "CLAUDE.md"))).toBe(true);
  });
});
