#!/usr/bin/env node
// cli.ts — главная точка входа
import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { resolve } from "path";
import { scanDirectory } from "./scanner.js";
import { analyzePatterns } from "./analyzer.js";
import { printReport } from "./reporter.js";
const program = new Command();
program
    .name("semvibe")
    .description(chalk.cyan("Find architectural inconsistencies in AI-generated codebases"))
    .version("0.1.0");
program
    .command("scan [directory]")
    .description("Scan a directory for architectural inconsistencies")
    .action(async (directory = ".") => {
    const dir = resolve(directory);
    // Шаг 1: Сканируем файлы
    const scanSpinner = ora({
        text: chalk.dim(`Scanning ${dir}...`),
        spinner: "dots",
    }).start();
    let files;
    try {
        files = await scanDirectory(dir);
        scanSpinner.succeed(chalk.dim(`Found ${chalk.white(files.length)} source files`));
    }
    catch (err) {
        scanSpinner.fail(chalk.red("Failed to scan directory"));
        console.error(err);
        process.exit(1);
    }
    if (files.length === 0) {
        console.log(chalk.yellow("\n  No JS/TS files found in this directory.\n"));
        process.exit(0);
    }
    // Шаг 2: Анализируем паттерны через Claude
    const analyzeSpinner = ora({
        text: chalk.dim("Analyzing architectural patterns (this may take 30-60s for local models)..."),
        spinner: "dots",
    }).start();
    let result;
    try {
        result = await analyzePatterns(files);
        analyzeSpinner.succeed(chalk.dim("Analysis complete"));
    }
    catch (err) {
        analyzeSpinner.fail(chalk.red("Analysis failed"));
        console.error(chalk.red("\n  Error calling Claude API. Check your API key.\n"));
        console.error(err);
        process.exit(1);
    }
    // Шаг 3: Выводим результаты
    printReport(result, dir);
});
// Если запустили без аргументов — показываем help
program.parse(process.argv);
if (process.argv.length <= 2) {
    program.help();
}
