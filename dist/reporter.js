// reporter.ts
// Красивый вывод результатов в терминал
import chalk from "chalk";
// Иконки и цвета по уровню серьёзности
const SEVERITY_CONFIG = {
    critical: { icon: "🔴", color: chalk.red.bold, label: "CRITICAL" },
    high: { icon: "🟠", color: chalk.yellow.bold, label: "HIGH" },
    medium: { icon: "🟡", color: chalk.cyan, label: "MEDIUM" },
    low: { icon: "🔵", color: chalk.blue, label: "LOW" },
};
function printHeader(filesScanned, dir, model) {
    console.log();
    console.log(chalk.bold.white("╔════════════════════════════════════════╗"));
    console.log(chalk.bold.white("║") + chalk.bold.cyan("         semvibe · vibe scan            ") + chalk.bold.white("║"));
    console.log(chalk.bold.white("╚════════════════════════════════════════╝"));
    console.log();
    console.log(chalk.dim(`  Scanned: ${chalk.white(dir)}`));
    console.log(chalk.dim(`  Files:   ${chalk.white(filesScanned)}`));
    console.log(chalk.dim(`  Model:   ${chalk.white(model)}`) + (model.includes("Ollama") ? chalk.green(" (free)") : chalk.yellow(" (API)")));
    console.log();
}
function printPattern(pattern, index) {
    const cfg = SEVERITY_CONFIG[pattern.severity];
    console.log(chalk.bold(`  ${cfg.icon}  #${index + 1} — ${pattern.name}`) +
        "  " +
        cfg.color(`[${cfg.label}]`));
    console.log();
    // Показываем все варианты реализации
    console.log(chalk.dim("    Variants found:"));
    for (const variant of pattern.variants) {
        const fileList = variant.files.join(", ");
        console.log(chalk.white(`    • ${variant.approach}`));
        console.log(chalk.dim(`      in: ${fileList}`));
        if (variant.example) {
            // Показываем пример кода
            const exampleLines = variant.example
                .split("\n")
                .slice(0, 3) // максимум 3 строки
                .map((line) => chalk.green(`      │ ${line}`))
                .join("\n");
            console.log(exampleLines);
        }
        console.log();
    }
    // Почему это проблема
    console.log(chalk.dim("    Impact:"));
    console.log(chalk.white(`    ${pattern.impact}`));
    console.log();
    // Что делать
    console.log(chalk.dim("    Fix:"));
    console.log(chalk.cyan(`    → ${pattern.recommendation}`));
    console.log();
    console.log(chalk.dim("  " + "─".repeat(40)));
    console.log();
}
function printSummary(result) {
    const { patterns } = result;
    if (patterns.length === 0) {
        console.log(chalk.green.bold("  ✅  No architectural inconsistencies found!"));
        console.log(chalk.dim(`  ${result.summary}`));
        console.log();
        return;
    }
    // Считаем по severity
    const counts = {
        critical: patterns.filter((p) => p.severity === "critical").length,
        high: patterns.filter((p) => p.severity === "high").length,
        medium: patterns.filter((p) => p.severity === "medium").length,
        low: patterns.filter((p) => p.severity === "low").length,
    };
    console.log(chalk.bold("  Summary"));
    console.log(chalk.dim("  ") + result.summary);
    console.log();
    console.log(`  ${chalk.red(`${counts.critical} critical`)}  ` +
        `${chalk.yellow(`${counts.high} high`)}  ` +
        `${chalk.cyan(`${counts.medium} medium`)}  ` +
        `${chalk.blue(`${counts.low} low`)}`);
    console.log();
}
export function printReport(result, dir) {
    printHeader(result.filesScanned, dir, result.model);
    if (result.patterns.length === 0) {
        printSummary(result);
        return;
    }
    console.log(chalk.bold.white(`  Found ${result.patterns.length} architectural inconsistenc${result.patterns.length === 1 ? "y" : "ies"}:`));
    console.log();
    console.log(chalk.dim("  " + "─".repeat(40)));
    console.log();
    // Сортируем: сначала critical, потом high, medium, low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...result.patterns].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    sorted.forEach((pattern, i) => printPattern(pattern, i));
    printSummary(result);
}
