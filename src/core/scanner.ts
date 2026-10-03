import { glob } from "glob";
import { readFileSync, existsSync } from "fs";
import { relative, join } from "path";
import createIgnore from "ignore";

export interface ScannedFile {
  path: string;      // relative path
  content: string;   // source code content
  lines: number;     // line count
}

const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/*.test.*",
  "**/*.spec.*",
  "**/*.mock.*",
  "**/*.d.ts",
];

export async function scanCodebase(dir: string): Promise<ScannedFile[]> {
  // Load .gitignore rules if present
  const ig = createIgnore.default ? createIgnore.default() : createIgnore();
  const gitignorePath = join(dir, ".gitignore");
  if (existsSync(gitignorePath)) {
    try {
      const gitignoreContent = readFileSync(gitignorePath, "utf-8");
      ig.add(gitignoreContent);
    } catch {
      // Ignore read errors
    }
  }

  // Find all TS/JS files
  const filePaths = await glob("**/*.{ts,tsx,js,jsx}", {
    cwd: dir,
    ignore: DEFAULT_IGNORES,
    absolute: true,
    nodir: true,
  });

  const results: ScannedFile[] = [];

  for (const absPath of filePaths) {
    const relPath = relative(dir, absPath);

    // Filter via .gitignore rules
    if (ig.ignores(relPath)) {
      continue;
    }

    try {
      const content = readFileSync(absPath, "utf-8");
      results.push({
        path: relPath,
        content,
        lines: content.split("\n").length,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return results;
}
