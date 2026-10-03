import { describe, it, expect } from "vitest";

describe("Test Infrastructure", () => {
  it("runs vitest in Node >= 20 ESM environment", () => {
    const major = parseInt(process.versions.node.split(".")[0], 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });
});
