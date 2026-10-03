import { describe, it, expect } from "vitest";
import { runMutationBenchmark } from "../../benchmark/build_baseline_and_mutations.js";

describe("Gate 2 Seeded Mutations Suite (20 Isolated Injections)", () => {
  it("executes baseline negative control and detects >= 85% of seeded mutations", async () => {
    const result = await runMutationBenchmark();
    expect(result.total).toBe(20);
    expect(result.detectedCount).toBeGreaterThanOrEqual(17);
    expect(result.passed).toBe(true);
  }, 60000);
});
