import { FileSignature, Invariant, Outlier } from "./types.js";

function getSnippet(content: string | undefined, line: number, contextLines = 3): string {
  if (!content) return "";
  const lines = content.split("\n");
  if (lines.length <= contextLines * 2 + 1) {
    return content;
  }
  const targetIndex = Math.min(Math.max(0, line - 1), lines.length - 1);
  const start = Math.max(0, targetIndex - contextLines);
  const end = Math.min(lines.length, targetIndex + contextLines + 1);
  return lines.slice(start, end).join("\n");
}

export function detectOutliers(
  signatures: FileSignature[],
  invariants: Invariant[],
  fileContents: Record<string, string> = {}
): Outlier[] {
  const outliers: Outlier[] = [];

  for (const inv of invariants) {
    if (inv.type === "error-handling" && inv.layer) {
      for (const sig of signatures) {
        if (sig.layer !== inv.layer) continue;

        for (const fn of sig.functions) {
          // Ignore 'none' helper functions
          if (fn.errorStrategy === "none") continue;

          if (fn.errorStrategy !== inv.dominantPattern) {
            const content = fileContents[sig.filePath];
            outliers.push({
              filePath: sig.filePath,
              functionName: fn.name,
              line: fn.line,
              ruleId: inv.id,
              observed: fn.errorStrategy,
              expected: inv.dominantPattern,
              codeSnippet: getSnippet(content, fn.line),
            });
          }
        }
      }
    } else if (inv.type === "library-role") {
      const role = inv.id.replace("inv-lib-", "");

      for (const sig of signatures) {
        // Check imports
        for (const imp of sig.imports) {
          if (imp.role === role && imp.source !== inv.dominantPattern) {
            const content = fileContents[sig.filePath];
            outliers.push({
              filePath: sig.filePath,
              line: 1,
              ruleId: inv.id,
              observed: imp.source,
              expected: inv.dominantPattern,
              codeSnippet: getSnippet(content, 1),
            });
          }
        }

        // Check global fetch
        if (role === "http") {
          if (sig.globalCalls.includes("fetch") && inv.dominantPattern !== "native-fetch") {
            const content = fileContents[sig.filePath];
            outliers.push({
              filePath: sig.filePath,
              line: 1,
              ruleId: inv.id,
              observed: "native-fetch",
              expected: inv.dominantPattern,
              codeSnippet: getSnippet(content, 1),
            });
          }
        }
      }
    }
  }

  return outliers;
}

export function findPositiveExemplar(
  signatures: FileSignature[],
  invariant: Invariant,
  fileContents: Record<string, string>
): string | undefined {
  if (invariant.type === "error-handling" && invariant.layer) {
    for (const sig of signatures) {
      if (sig.layer !== invariant.layer) continue;
      const conformingFn = sig.functions.find(f => f.errorStrategy === invariant.dominantPattern);
      if (conformingFn) {
        return getSnippet(fileContents[sig.filePath], conformingFn.line, 5);
      }
    }
  }
  return undefined;
}
