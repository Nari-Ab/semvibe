import { Outlier, VerifiedViolation } from "./types.js";

export interface LLMClient {
  complete(prompt: string): Promise<string>;
}

export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export async function verifyOutlier(
  outlier: Outlier,
  ruleDescription: string,
  exemplarCode?: string,
  client?: LLMClient
): Promise<VerifiedViolation> {
  // If no client provided, return AST-based baseline
  if (!client) {
    return {
      outlier,
      isTruePositive: true,
      confidence: 0.75,
      reasoning: "AST-only mode: statistical outlier confirmed by syntactic inspection.",
      suggestedRemediation: `Align code with standard: ${outlier.expected}`,
    };
  }

  const prompt = `
You are an expert software architect evaluating whether a suspicious code snippet is a genuine architectural inconsistency (true positive) or an acceptable intentional exception (false positive).

ARCHITECTURAL INVARIANT:
${ruleDescription}
Expected pattern: ${outlier.expected}
Observed in outlier: ${outlier.observed}

${exemplarCode ? `COMPLIANT REPOSITORY GOLD STANDARD EXAMPLE:\n\`\`\`typescript\n${exemplarCode}\n\`\`\`\n` : ""}

SUSPICIOUS CODE SNIPPET (File: ${outlier.filePath}, Line: ${outlier.line}):
\`\`\`typescript
${outlier.codeSnippet}
\`\`\`

Evaluate if this is a genuine deviation from the project's standard architecture or an intentional edge-case/test/panic.
Return ONLY valid JSON matching this exact structure:
{
  "isTruePositive": boolean,
  "confidence": number (between 0.0 and 1.0),
  "reasoning": "brief 1-2 sentence explanation",
  "suggestedRemediation": "how to refactor to match the project standard"
}
`;

  try {
    const rawResponse = await client.complete(prompt);
    const cleaned = cleanJsonOutput(rawResponse);
    const parsed = JSON.parse(cleaned);

    return {
      outlier,
      isTruePositive: Boolean(parsed.isTruePositive),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      reasoning: parsed.reasoning || "Verified by semantic inspection.",
      suggestedRemediation: parsed.suggestedRemediation,
    };
  } catch (err: any) {
    return {
      outlier,
      isTruePositive: true,
      confidence: 0.7,
      reasoning: `AST fallback (semantic check skipped: ${err?.message || "error"}).`,
      suggestedRemediation: `Align code with standard: ${outlier.expected}`,
    };
  }
}
