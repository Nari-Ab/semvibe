import chalk from "chalk";
import { LearnResult, ScanResult, ExportResult } from "./core/pipeline.js";

export function printLearnReport(result: LearnResult, dir: string) {
  console.log();
  console.log(chalk.bold.cyan("╔══════════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║") + chalk.bold.white("              semvibe · invariant discovery               ") + chalk.bold.cyan("║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════════════════════════╝"));
  console.log();
  console.log(chalk.dim(`  Repository: ${chalk.white(dir)}`));
  console.log();

  if (result.invariants.length > 0) {
    console.log(chalk.bold.green(`  ✔ Discovered ${result.invariants.length} Dominant Architectural Invariants:`));
    console.log();
    for (const inv of result.invariants) {
      const pct = Math.round(inv.confidence * 100);
      console.log(
        `  ${chalk.cyan("•")} ${chalk.bold.white(inv.description)} ` +
        chalk.green(`[${pct}% Dominance]`)
      );
      console.log(chalk.dim(`    Pattern:     ${inv.dominantPattern}`));
      console.log(chalk.dim(`    Sample Size: ${inv.sampleSize} instances across ${inv.fileCount} files`));
      console.log();
    }
  } else {
    console.log(chalk.yellow("  ⚠ No dominant invariants met the >=75% threshold."));
    console.log();
  }

  if (result.divergences.length > 0) {
    console.log(chalk.bold.yellow(`  ⚡ Found ${result.divergences.length} Unresolved Style Divergences:`));
    console.log();
    for (const div of result.divergences) {
      console.log(`  ${chalk.yellow("•")} ${chalk.bold.white(div.description)}`);
      for (const p of div.patterns) {
        console.log(chalk.dim(`    - ${p.pattern}: ${p.count} instances (${p.percentage}%)`));
      }
      console.log();
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    console.log(chalk.dim("  Sample Warnings:"));
    for (const w of result.warnings) {
      console.log(chalk.dim(`  ! ${w}`));
    }
    console.log();
  }

  if (result.persisted) {
    console.log(chalk.green("  ✔ Saved verified invariants to .semvibe/invariants.json"));
  } else {
    console.log(chalk.dim("  Run with --save or confirm prompt to persist invariants."));
  }
  console.log();
}

export function printScanReport(result: ScanResult, dir: string) {
  console.log();
  console.log(chalk.bold.cyan("╔══════════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("║") + chalk.bold.white("                 semvibe · semantic scan                  ") + chalk.bold.cyan("║"));
  console.log(chalk.bold.cyan("╚══════════════════════════════════════════════════════════╝"));
  console.log();
  console.log(chalk.dim(`  Scanned:    ${chalk.white(dir)}`));
  console.log(chalk.dim(`  Files:      ${chalk.white(result.totalFilesScanned)}`));
  console.log(chalk.dim(`  Invariants: ${chalk.white(result.invariantsUsed.length)}`));
  console.log();

  if (result.violations.length === 0) {
    if (result.invariantsUsed.length === 0) {
      console.log(chalk.bold.yellow("  ⚠ Notice: Insufficient sample size to establish statistical invariants (< 5 files per architectural role)."));
      console.log(chalk.dim("    Semvibe requires recurring patterns across multiple files to infer codebase conventions."));
    } else {
      console.log(chalk.bold.green("  ✅ No architectural inconsistencies detected! Codebase is aligned."));
    }
    console.log();
    return;
  }

  console.log(chalk.bold.red(`  ❌ Found ${result.violations.length} Architectural Violation${result.violations.length === 1 ? "" : "s"}:`));
  console.log();

  result.violations.forEach((v, idx) => {
    const o = v.outlier;
    console.log(
      chalk.bold.red(`  #${idx + 1} `) +
      chalk.bold.white(`${o.filePath}:${o.line}`) +
      (o.functionName ? chalk.dim(` in ${o.functionName}()`) : "")
    );
    console.log(chalk.dim(`    Observed: `) + chalk.red(o.observed) + chalk.dim(` | Expected: `) + chalk.green(o.expected));
    console.log(chalk.dim(`    Reason:   `) + chalk.white(v.reasoning));
    if (v.suggestedRemediation) {
      console.log(chalk.dim(`    Fix:      `) + chalk.cyan(v.suggestedRemediation));
    }
    console.log();
  });
}

export function printExportReport(result: ExportResult, dir: string) {
  console.log();
  console.log(chalk.bold.green(`  ✔ Exported ${result.invariantsCount} architectural invariants:`));
  for (const f of result.modifiedFiles) {
    console.log(chalk.cyan(`    → ${f}`));
  }
  console.log();
  console.log(chalk.dim("  AI agents (Cursor, Claude Code, Windsurf) will now automatically obey these rules."));
  console.log();
}
