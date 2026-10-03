import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { scanCodebase } from "../../src/core/scanner.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve, join } from "path";

describe("Scanner with Filter Fixtures", () => {
  const fixtureDir = resolve("tests/fixtures/scanner-temp");

  beforeAll(() => {
    if (existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true });
    mkdirSync(join(fixtureDir, "src/sub"), { recursive: true });
    mkdirSync(join(fixtureDir, "node_modules/dummy"), { recursive: true });
    mkdirSync(join(fixtureDir, "dist"), { recursive: true });

    // Valid files
    writeFileSync(join(fixtureDir, "src/valid.ts"), "export const a = 1;");
    writeFileSync(join(fixtureDir, "src/sub/nested.service.ts"), "export class Svc {}");

    // Files that MUST be excluded
    writeFileSync(join(fixtureDir, "node_modules/dummy/index.ts"), "export const dummy = 1;");
    writeFileSync(join(fixtureDir, "dist/bundle.js"), "console.log('dist');");
    writeFileSync(join(fixtureDir, "src/app.test.ts"), "test('x', () => {});");
    writeFileSync(join(fixtureDir, "src/app.spec.tsx"), "test('y', () => {});");
    writeFileSync(join(fixtureDir, "src/types.d.ts"), "export type ID = string;");
    writeFileSync(join(fixtureDir, "src/ignored-by-git.ts"), "export const secret = true;");

    // .gitignore
    writeFileSync(join(fixtureDir, ".gitignore"), "ignored-by-git.ts\n");
  });

  afterAll(() => {
    if (existsSync(fixtureDir)) rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("includes valid files and strictly excludes node_modules, dist, tests, d.ts and gitignored files", async () => {
    const files = await scanCodebase(fixtureDir);
    const paths = files.map(f => f.path);

    // Included
    expect(paths).toContain("src/valid.ts");
    expect(paths).toContain("src/sub/nested.service.ts");

    // Excluded
    expect(paths.some(p => p.includes("node_modules"))).toBe(false);
    expect(paths.some(p => p.includes("dist"))).toBe(false);
    expect(paths.some(p => p.endsWith(".test.ts"))).toBe(false);
    expect(paths.some(p => p.endsWith(".spec.tsx"))).toBe(false);
    expect(paths.some(p => p.endsWith(".d.ts"))).toBe(false);
    expect(paths.some(p => p.includes("ignored-by-git"))).toBe(false);

    expect(files).toHaveLength(2);
  });
});
