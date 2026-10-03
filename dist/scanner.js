// scanner.ts
// Сканирует директорию и читает все JS/TS файлы
import { glob } from "glob";
import { readFileSync, statSync } from "fs";
import { relative } from "path";
const MAX_FILE_SIZE = 50_000; // 50KB — не берём огромные файлы
const MAX_FILES = 30; // не более 30 файлов за раз (экономим токены)
export async function scanDirectory(dir) {
    // Ищем все JS/TS файлы, исключаем node_modules, dist, тесты
    const files = await glob("**/*.{ts,tsx,js,jsx}", {
        cwd: dir,
        ignore: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/*.d.ts",
        ],
        absolute: true,
    });
    const codeFiles = [];
    for (const filePath of files.slice(0, MAX_FILES)) {
        const stat = statSync(filePath);
        // Пропускаем слишком большие файлы
        if (stat.size > MAX_FILE_SIZE)
            continue;
        const content = readFileSync(filePath, "utf-8");
        const relativePath = relative(dir, filePath);
        codeFiles.push({
            path: relativePath,
            content,
            lines: content.split("\n").length,
        });
    }
    return codeFiles;
}
