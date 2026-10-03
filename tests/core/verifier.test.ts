import { describe, it, expect } from "vitest";
import { verifyOutlier, LLMClient } from "../../src/core/verifier.js";
import { Outlier } from "../../src/core/types.js";

describe("Targeted Semantic LLM Verifier", () => {
  const sampleOutlier: Outlier = {
    filePath: "src/services/billing.service.ts",
    functionName: "chargeCustomer",
    line: 25,
    ruleId: "inv-err-service",
    observed: "throw",
    expected: "result-pattern",
    codeSnippet: `
      export function chargeCustomer(amount: number) {
        if (amount <= 0) throw new Error("Invalid amount");
        return processPayment(amount);
      }
    `,
  };

  const sampleExemplar = `
    export function refundCustomer(id: string): Result<Refund, PaymentError> {
      if (!id) return err(new PaymentError("ID required"));
      return ok({ status: "refunded" });
    }
  `;

  it("verifies true positive violation when LLM confirms it breaks project standard", async () => {
    const mockClient: LLMClient = {
      complete: async () => JSON.stringify({
        isTruePositive: true,
        confidence: 0.95,
        reasoning: "The function throws a raw Error instead of returning Result<T, PaymentError> like the standard service methods.",
        suggestedRemediation: "Return err(new PaymentError('Invalid amount')) instead of throwing.",
      }),
    };

    const res = await verifyOutlier(sampleOutlier, "Services must return Result<T, E>", sampleExemplar, mockClient);
    expect(res.isTruePositive).toBe(true);
    expect(res.confidence).toBe(0.95);
    expect(res.suggestedRemediation).toContain("Return err");
  });

  it("filters false positives when LLM identifies an intentional special case (e.g. migration or guard)", async () => {
    const mockClient: LLMClient = {
      complete: async () => JSON.stringify({
        isTruePositive: false,
        confidence: 0.88,
        reasoning: "This is a fatal panic handler, throwing a raw exception is intentional and not architectural drift.",
      }),
    };

    const res = await verifyOutlier(sampleOutlier, "Services must return Result<T, E>", sampleExemplar, mockClient);
    expect(res.isTruePositive).toBe(false);
    expect(res.reasoning).toContain("intentional");
  });

  it("handles markdown code fences in LLM JSON response safely", async () => {
    const mockClient: LLMClient = {
      complete: async () => "```json\n{\n  \"isTruePositive\": true,\n  \"confidence\": 0.9,\n  \"reasoning\": \"Valid violation.\"\n}\n```",
    };

    const res = await verifyOutlier(sampleOutlier, "Rule", sampleExemplar, mockClient);
    expect(res.isTruePositive).toBe(true);
    expect(res.confidence).toBe(0.9);
  });

  it("falls back gracefully to AST verdict when LLM fails or is in offline mode", async () => {
    // 1. Offline mode (no client)
    const offlineRes = await verifyOutlier(sampleOutlier, "Rule", sampleExemplar, undefined);
    expect(offlineRes.isTruePositive).toBe(true);
    expect(offlineRes.reasoning).toContain("AST-only mode");

    // 2. Errored client
    const failingClient: LLMClient = {
      complete: async () => { throw new Error("API Timeout"); },
    };
    const errorRes = await verifyOutlier(sampleOutlier, "Rule", sampleExemplar, failingClient);
    expect(errorRes.isTruePositive).toBe(true);
    expect(errorRes.reasoning).toContain("AST fallback");
  });
});
