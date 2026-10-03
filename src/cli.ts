#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { resolve } from "path";
import { runLearn, runScan, runExportRules } from "./core/pipeline.js";
import { printLearnReport, printScanReport, printExportReport } from "./reporter.js";

const program = new Command();

program
  .name("semvibe")
  .description(chalk.cyan("Detect and prevent semantic architectural drift in TypeScript codebases"))
  .version("0.2.0");

program
  .command("learn [directory]")
  .description("Discover statistically dominant architectural invariants from the codebase")
  .option("--auto-confirm", "Automatically save discovered invariants to .semvibe/invariants.json", true)
  .action(async (directory = ".", options) => {
    const dir = resolve(directory);
    const spinner = ora({
      text: chalk.dim(`Learning architectural conventions from ${dir}...`),
      spinner: "dots",
    }).start();

    try {
      const result = await runLearn(dir, { autoConfirm: options.autoConfirm });
      spinner.succeed(chalk.dim("Invariant discovery complete."));
      printLearnReport(result, dir);
    } catch (err: any) {
      spinner.fail(chalk.red("Failed to discover invariants"));
      console.error(err);
      process.exit(1);
    }
  });

program
  .command("scan [directory]")
  .description("Scan codebase for semantic inconsistencies and architectural outliers")
  .option("--ast-only", "Run offline AST checks without invoking external LLM verification", false)
  .action(async (directory = ".", options) => {
    const dir = resolve(directory);
    const spinner = ora({
      text: chalk.dim(`Scanning ${dir} for architectural drift...`),
      spinner: "dots",
    }).start();

    try {
      const result = await runScan(dir, { astOnly: options.astOnly });
      spinner.succeed(chalk.dim("Semantic scan complete."));
      printScanReport(result, dir);
    } catch (err: any) {
      spinner.fail(chalk.red("Scan failed"));
      console.error(err);
      process.exit(1);
    }
  });

program
  .command("export-rules [directory]")
  .description("Export discovered invariants into AGENTS.md and CLAUDE.md for AI agent guardrails")
  .action(async (directory = ".") => {
    const dir = resolve(directory);
    const spinner = ora({
      text: chalk.dim(`Exporting agent rules in ${dir}...`),
      spinner: "dots",
    }).start();

    try {
      const result = await runExportRules(dir);
      spinner.succeed(chalk.dim("Rules exported successfully."));
      printExportReport(result, dir);
    } catch (err: any) {
      spinner.fail(chalk.red("Failed to export rules"));
      console.error(err);
      process.exit(1);
    }
  });

// Handle default run (e.g. `npx semvibe .`)
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
