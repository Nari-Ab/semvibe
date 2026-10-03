import { Invariant } from "./types.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const START_MARKER = "<!-- SEMVIBE:START -->";
export const END_MARKER = "<!-- SEMVIBE:END -->";

export function formatRulesMarkdown(invariants: Invariant[]): string {
  const lines: string[] = [
    START_MARKER,
    "### Architectural Invariants (Enforced by Semvibe)",
    "",
    "> The following rules are statistically dominant patterns established in this codebase.",
    "> When generating code, AI agents MUST follow these conventions strictly:",
    "",
  ];

  for (const inv of invariants) {
    const confidencePct = Math.round(inv.confidence * 100);
    lines.push(`- **${inv.description}**`);
    lines.push(`  - *Pattern:* \`${inv.dominantPattern}\``);
    lines.push(`  - *Confidence:* ${confidencePct}% (sampled across ${inv.sampleSize} instances in ${inv.fileCount} files)`);
    lines.push("");
  }

  lines.push(END_MARKER);
  return lines.join("\n");
}

export function syncRulesIntoFile(originalContent: string, newRulesBlock: string): string {
  const startIndex = originalContent.indexOf(START_MARKER);
  const endIndex = originalContent.indexOf(END_MARKER);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Replace existing block
    const before = originalContent.slice(0, startIndex);
    const after = originalContent.slice(endIndex + END_MARKER.length);
    return before + newRulesBlock + after;
  }

  // Markers not present: append to bottom
  const trimmed = originalContent.trim();
  if (trimmed.length === 0) {
    return newRulesBlock + "\n";
  }
  return trimmed + "\n\n" + newRulesBlock + "\n";
}

export function exportRulesToProject(
  projectDir: string,
  invariants: Invariant[],
  targetFilenames: string[] = ["AGENTS.md", "CLAUDE.md"]
): string[] {
  const rulesBlock = formatRulesMarkdown(invariants);
  const modifiedFiles: string[] = [];

  for (const filename of targetFilenames) {
    const filePath = join(projectDir, filename);
    let original = "";
    if (existsSync(filePath)) {
      original = readFileSync(filePath, "utf-8");
    }

    const updated = syncRulesIntoFile(original, rulesBlock);
    writeFileSync(filePath, updated, "utf-8");
    modifiedFiles.push(filename);
  }

  return modifiedFiles;
}
