import { describe, it, expect } from "vitest";
import { discoverInvariants } from "../../src/core/invariants.js";
import { FileSignature } from "../../src/core/types.js";

describe("Statistical Invariant Discovery", () => {
  it("enforces minimum file count (>= 3 files) and minimum sample size (>= 5 error-handling functions)", () => {
    // 5 functions but all in 1 file -> should NOT declare an invariant
    const singleFileSignatures: FileSignature[] = [
      {
        filePath: "src/services/one.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f1", line: 1, errorStrategy: "result-pattern" },
          { name: "f2", line: 5, errorStrategy: "result-pattern" },
          { name: "f3", line: 10, errorStrategy: "result-pattern" },
          { name: "f4", line: 15, errorStrategy: "result-pattern" },
          { name: "f5", line: 20, errorStrategy: "result-pattern" },
        ],
        hasParseErrors: false,
      }
    ];

    const result = discoverInvariants(singleFileSignatures, { minSampleSize: 5, minFileCount: 3 });
    expect(result.dominantInvariants).toHaveLength(0);
    expect(result.insufficientSampleWarnings).toBeDefined();
    expect(result.insufficientSampleWarnings?.length).toBeGreaterThan(0);
  });

  it("ignores 'none' errorStrategy functions so pure helpers do not dilute error conventions", () => {
    // 3 files, 6 functions with Result, 20 functions with 'none' (pure math/calc)
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/a.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f1", line: 1, errorStrategy: "result-pattern" },
          { name: "f2", line: 5, errorStrategy: "result-pattern" },
          { name: "calc1", line: 10, errorStrategy: "none" },
          { name: "calc2", line: 15, errorStrategy: "none" },
        ],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/b.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f3", line: 1, errorStrategy: "result-pattern" },
          { name: "f4", line: 5, errorStrategy: "result-pattern" },
          { name: "calc3", line: 10, errorStrategy: "none" },
        ],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/c.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f5", line: 1, errorStrategy: "result-pattern" },
          { name: "f6", line: 5, errorStrategy: "throw" },
        ],
        hasParseErrors: false,
      },
    ];

    // 5 result-pattern vs 1 throw = 83.3% dominance (denominator is 6, NOT 26!)
    const result = discoverInvariants(signatures, { minSampleSize: 5, minFileCount: 3, dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(1);
    expect(result.dominantInvariants[0].dominantPattern).toBe("result-pattern");
    expect(result.dominantInvariants[0].confidence).toBeCloseTo(0.833, 2);
  });

  it("detects unresolved divergence when multiple patterns exist without a >= 75% dominant pattern", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/a.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f1", line: 1, errorStrategy: "throw" },
          { name: "f2", line: 5, errorStrategy: "throw" },
        ],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/b.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f3", line: 1, errorStrategy: "result-pattern" },
          { name: "f4", line: 5, errorStrategy: "result-pattern" },
        ],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/c.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "f5", line: 1, errorStrategy: "throw" },
          { name: "f6", line: 5, errorStrategy: "result-pattern" },
        ],
        hasParseErrors: false,
      },
    ];

    // 3 throw vs 3 result = 50% split -> Unresolved Style Divergence
    const result = discoverInvariants(signatures, { minSampleSize: 5, minFileCount: 3, dominanceThreshold: 0.75 });
    expect(result.dominantInvariants).toHaveLength(0);
    expect(result.unresolvedDivergences).toHaveLength(1);
    expect(result.unresolvedDivergences[0].type).toBe("error-handling");
    expect(result.unresolvedDivergences[0].patterns).toHaveLength(2);
  });

  it("detects single library role invariant (e.g. project standardizes on zod, or flags redundancy)", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/a.service.ts",
        layer: "service",
        imports: [{ source: "zod", isExternal: true, specifiers: ["z"], role: "validator" }],
        globalCalls: [],
        functions: [],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/b.service.ts",
        layer: "service",
        imports: [{ source: "zod", isExternal: true, specifiers: ["z"], role: "validator" }],
        globalCalls: [],
        functions: [],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/c.service.ts",
        layer: "service",
        imports: [{ source: "zod", isExternal: true, specifiers: ["z"], role: "validator" }],
        globalCalls: [],
        functions: [],
        hasParseErrors: false,
      },
    ];

    const result = discoverInvariants(signatures, { minSampleSize: 3, minFileCount: 3 });
    const validatorInv = result.dominantInvariants.find(i => i.type === "library-role" && i.dominantPattern === "zod");
    expect(validatorInv).toBeDefined();
    expect(validatorInv?.confidence).toBe(1.0);
  });
});
