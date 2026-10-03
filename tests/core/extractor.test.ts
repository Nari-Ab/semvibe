import { describe, it, expect } from "vitest";
import { extractFileSignature, PACKAGE_ROLES } from "../../src/core/extractor.js";

describe("Enhanced AST Extractor", () => {
  it("detects imports, external libraries, and assigns known library roles", () => {
    const code = `
      import axios from "axios";
      import { z } from "zod";
      import { userService } from "./userService";
    `;
    const sig = extractFileSignature("src/controllers/user.controller.ts", code);
    expect(sig.layer).toBe("controller");
    expect(sig.imports).toHaveLength(3);

    const axiosImport = sig.imports.find(i => i.source === "axios");
    expect(axiosImport?.isExternal).toBe(true);
    expect(axiosImport?.role).toBe("http");

    const zodImport = sig.imports.find(i => i.source === "zod");
    expect(zodImport?.isExternal).toBe(true);
    expect(zodImport?.role).toBe("validator");

    const localImport = sig.imports.find(i => i.source === "./userService");
    expect(localImport?.isExternal).toBe(false);
  });

  it("detects global fetch calls without any import", () => {
    const code = `
      export async function loadData() {
        const response = await fetch("https://api.example.com/items");
        return response.json();
      }
    `;
    const sig = extractFileSignature("src/services/api.service.ts", code);
    expect(sig.globalCalls).toContain("fetch");
    expect(sig.layer).toBe("service");
  });

  it("classifies error handling per function (throw vs Result vs { success: false })", () => {
    const code = `
      export function parseThrow() {
        throw new Error("Invalid payload");
      }

      export function parseResult(): Result<string, Error> {
        return ok("all good");
      }

      export function parseSuccessObj() {
        return { success: false, error: "bad request" };
      }

      export function calculateSum(a: number, b: number) {
        return a + b;
      }
    `;
    const sig = extractFileSignature("src/services/calc.service.ts", code);
    expect(sig.functions).toHaveLength(4);

    const fnThrow = sig.functions.find(f => f.name === "parseThrow");
    expect(fnThrow?.errorStrategy).toBe("throw");

    const fnResult = sig.functions.find(f => f.name === "parseResult");
    expect(fnResult?.errorStrategy).toBe("result-pattern");

    const fnSuccess = sig.functions.find(f => f.name === "parseSuccessObj");
    expect(fnSuccess?.errorStrategy).toBe("success-boolean");

    const fnSum = sig.functions.find(f => f.name === "calculateSum");
    expect(fnSum?.errorStrategy).toBe("none");
  });

  it("associates throw statement with the closest enclosing function (nested functions)", () => {
    const code = `
      export function outer() {
        const inner = () => {
          throw new Error("inner error");
        };
        return inner();
      }
    `;
    const sig = extractFileSignature("src/services/nested.service.ts", code);
    expect(sig.functions.length).toBeGreaterThanOrEqual(1);
    // At least the inner function must be classified as throw
    const throwingFn = sig.functions.find(f => f.errorStrategy === "throw");
    expect(throwingFn).toBeDefined();
  });

  it("handles syntax errors gracefully with parseDiagnostics without throwing", () => {
    const brokenCode = `export function unclosed( {`;
    const sig = extractFileSignature("src/broken.ts", brokenCode);
    expect(sig).toBeDefined();
    expect(sig.hasParseErrors).toBe(true);
  });
});
