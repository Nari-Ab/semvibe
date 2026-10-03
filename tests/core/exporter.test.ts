import { describe, it, expect } from "vitest";
import { formatRulesMarkdown, syncRulesIntoFile } from "../../src/core/exporter.js";
import { Invariant } from "../../src/core/types.js";

describe("Modern Agent Rules Exporter", () => {
  const sampleInvariants: Invariant[] = [
    {
      id: "inv-err-service",
      type: "error-handling",
      layer: "service",
      dominantPattern: "result-pattern",
      description: "All services must return Result<T, AppError>",
      confidence: 0.92,
      sampleSize: 12,
      fileCount: 5,
    },
    {
      id: "inv-lib-http",
      type: "library-role",
      dominantPattern: "axios",
      description: "Project standardizes on axios for http requests",
      confidence: 0.95,
      sampleSize: 8,
      fileCount: 4,
    }
  ];

  it("formats invariants into clean Markdown rules delimited by markers", () => {
    const md = formatRulesMarkdown(sampleInvariants);
    expect(md).toContain("<!-- SEMVIBE:START -->");
    expect(md).toContain("### Architectural Invariants (Enforced by Semvibe)");
    expect(md).toContain("All services must return Result<T, AppError>");
    expect(md).toContain("Project standardizes on axios for http requests");
    expect(md).toContain("<!-- SEMVIBE:END -->");
  });

  it("updates existing rules block between markers without erasing other instructions", () => {
    const original = `# AI Agent Guidelines\n\nAlways use TypeScript.\n\n<!-- SEMVIBE:START -->\nOld outdated rules\n<!-- SEMVIBE:END -->\n\nKeep this instruction too!`;
    const newRules = "<!-- SEMVIBE:START -->\nNew verified rules\n<!-- SEMVIBE:END -->";

    const updated = syncRulesIntoFile(original, newRules);
    expect(updated).toContain("# AI Agent Guidelines");
    expect(updated).toContain("Always use TypeScript.");
    expect(updated).toContain("New verified rules");
    expect(updated).not.toContain("Old outdated rules");
    expect(updated).toContain("Keep this instruction too!");
  });

  it("appends rules with markers when file exists but has no markers yet", () => {
    const original = `# Existing Claude Rules\nBe concise.`;
    const newRules = "<!-- SEMVIBE:START -->\nNew rules\n<!-- SEMVIBE:END -->";

    const updated = syncRulesIntoFile(original, newRules);
    expect(updated).toContain("# Existing Claude Rules");
    expect(updated).toContain("Be concise.");
    expect(updated).toContain("<!-- SEMVIBE:START -->\nNew rules\n<!-- SEMVIBE:END -->");
  });
});
