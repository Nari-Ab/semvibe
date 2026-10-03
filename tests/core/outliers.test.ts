import { describe, it, expect } from "vitest";
import { detectOutliers, findPositiveExemplar } from "../../src/core/outliers.js";
import { Invariant, FileSignature } from "../../src/core/types.js";

describe("Outlier & Anomaly Detector", () => {
  const sampleInvariants: Invariant[] = [
    {
      id: "inv-err-service",
      type: "error-handling",
      layer: "service",
      dominantPattern: "result-pattern",
      description: "Services must return Result<T, E>",
      confidence: 0.85,
      sampleSize: 10,
      fileCount: 4,
    },
    {
      id: "inv-lib-http",
      type: "library-role",
      dominantPattern: "axios",
      description: "Project standardizes on axios for http",
      confidence: 0.9,
      sampleSize: 8,
      fileCount: 3,
    }
  ];

  it("flags functions that violate layer error-handling invariants", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/good.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "goodMethod", line: 5, errorStrategy: "result-pattern" },
        ],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/rogue.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "badMethod", line: 12, errorStrategy: "throw" },
        ],
        hasParseErrors: false,
      }
    ];

    const fileContents: Record<string, string> = {
      "src/services/rogue.service.ts": "function badMethod() { throw new Error('fail'); }"
    };

    const outliers = detectOutliers(signatures, sampleInvariants, fileContents);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].filePath).toBe("src/services/rogue.service.ts");
    expect(outliers[0].functionName).toBe("badMethod");
    expect(outliers[0].line).toBe(12);
    expect(outliers[0].observed).toBe("throw");
    expect(outliers[0].expected).toBe("result-pattern");
    expect(outliers[0].codeSnippet).toContain("throw new Error");
  });

  it("flags files that violate library-role invariants (e.g. rogue native-fetch when axios is dominant)", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/legacy.service.ts",
        layer: "service",
        imports: [{ source: "axios", isExternal: true, specifiers: ["axios"], role: "http" }],
        globalCalls: [],
        functions: [],
        hasParseErrors: false,
      },
      {
        filePath: "src/services/rogueFetch.service.ts",
        layer: "service",
        imports: [],
        globalCalls: ["fetch"],
        functions: [],
        hasParseErrors: false,
      }
    ];

    const fileContents: Record<string, string> = {
      "src/services/rogueFetch.service.ts": "export async function get() { return fetch('/api'); }"
    };

    const outliers = detectOutliers(signatures, sampleInvariants, fileContents);
    const httpOutlier = outliers.find(o => o.ruleId === "inv-lib-http");
    expect(httpOutlier).toBeDefined();
    expect(httpOutlier?.observed).toBe("native-fetch");
    expect(httpOutlier?.expected).toBe("axios");
  });

  it("extracts positive exemplar code snippet from compliant files", () => {
    const signatures: FileSignature[] = [
      {
        filePath: "src/services/standard.service.ts",
        layer: "service",
        imports: [],
        globalCalls: [],
        functions: [
          { name: "standardMethod", line: 4, errorStrategy: "result-pattern" }
        ],
        hasParseErrors: false,
      }
    ];

    const fileContents: Record<string, string> = {
      "src/services/standard.service.ts": "export function standardMethod(): Result<Data, Error> {\n  return ok(data);\n}"
    };

    const exemplar = findPositiveExemplar(signatures, sampleInvariants[0], fileContents);
    expect(exemplar).toBeDefined();
    expect(exemplar).toContain("standardMethod");
  });
});
