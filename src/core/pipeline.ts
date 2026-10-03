import { scanCodebase } from "./scanner.js";
import { extractFileSignature } from "./extractor.js";
import { discoverInvariants } from "./invariants.js";
import { detectOutliers, findPositiveExemplar } from "./outliers.js";
import { verifyOutlier, LLMClient } from "./verifier.js";
import { exportRulesToProject } from "./exporter.js";
import { Invariant, Divergence, VerifiedViolation, FileSignature } from "./types.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_DIR = ".semvibe";
const INVARIANTS_FILE = "invariants.json";

export interface LearnResult {
  invariants: Invariant[];
  divergences: Divergence[];
  warnings?: string[];
  persisted: boolean;
}

export interface ScanResult {
  violations: VerifiedViolation[];
  invariantsUsed: Invariant[];
  totalFilesScanned: number;
}

export interface ExportResult {
  modifiedFiles: string[];
  invariantsCount: number;
}

export function getInvariantsPath(dir: string): string {
  return join(dir, CONFIG_DIR, INVARIANTS_FILE);
}

export function loadSavedInvariants(dir: string): Invariant[] | null {
  const filePath = getInvariantsPath(dir);
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveInvariants(dir: string, invariants: Invariant[]): void {
  const configDirPath = join(dir, CONFIG_DIR);
  if (!existsSync(configDirPath)) {
    mkdirSync(configDirPath, { recursive: true });
  }
  writeFileSync(join(configDirPath, INVARIANTS_FILE), JSON.stringify(invariants, null, 2), "utf-8");
}

export async function runLearn(
  dir: string,
  options: { autoConfirm?: boolean; dominanceThreshold?: number; minSampleSize?: number; minFileCount?: number } = {}
): Promise<LearnResult> {
  const scannedFiles = await scanCodebase(dir);
  const signatures: FileSignature[] = [];

  for (const file of scannedFiles) {
    signatures.push(extractFileSignature(file.path, file.content));
  }

  const discovery = discoverInvariants(signatures, {
    dominanceThreshold: options.dominanceThreshold,
    minSampleSize: options.minSampleSize,
    minFileCount: options.minFileCount,
  });

  const shouldPersist = options.autoConfirm || false;
  if (shouldPersist && discovery.dominantInvariants.length > 0) {
    saveInvariants(dir, discovery.dominantInvariants);
  }

  return {
    invariants: discovery.dominantInvariants,
    divergences: discovery.unresolvedDivergences,
    warnings: discovery.insufficientSampleWarnings,
    persisted: shouldPersist,
  };
}

export async function runScan(
  dir: string,
  options: { astOnly?: boolean; client?: LLMClient } = {}
): Promise<ScanResult> {
  // 1. Get or learn invariants
  let invariants = loadSavedInvariants(dir);
  if (!invariants || invariants.length === 0) {
    const learnRes = await runLearn(dir, { autoConfirm: false });
    invariants = learnRes.invariants;
  }

  if (!invariants || invariants.length === 0) {
    return {
      violations: [],
      invariantsUsed: [],
      totalFilesScanned: 0,
    };
  }

  // 2. Scan codebase and extract signatures
  const scannedFiles = await scanCodebase(dir);
  const signatures: FileSignature[] = [];
  const fileContents: Record<string, string> = {};

  for (const file of scannedFiles) {
    signatures.push(extractFileSignature(file.path, file.content));
    fileContents[file.path] = file.content;
  }

  // 3. Detect candidate outliers
  const outliers = detectOutliers(signatures, invariants, fileContents);

  // 4. Verify outliers (AST-only or LLM)
  const violations: VerifiedViolation[] = [];

  for (const outlier of outliers) {
    const matchingInv = invariants.find(i => i.id === outlier.ruleId);
    const ruleDesc = matchingInv?.description || outlier.ruleId;
    const exemplar = matchingInv ? findPositiveExemplar(signatures, matchingInv, fileContents) : undefined;

    const verified = await verifyOutlier(
      outlier,
      ruleDesc,
      exemplar,
      options.astOnly ? undefined : options.client
    );

    if (verified.isTruePositive) {
      violations.push(verified);
    }
  }

  return {
    violations,
    invariantsUsed: invariants,
    totalFilesScanned: scannedFiles.length,
  };
}

export async function runExportRules(
  dir: string,
  targetFilenames: string[] = ["AGENTS.md", "CLAUDE.md"]
): Promise<ExportResult> {
  let invariants = loadSavedInvariants(dir);
  if (!invariants || invariants.length === 0) {
    const learnRes = await runLearn(dir, { autoConfirm: true });
    invariants = learnRes.invariants;
  }

  const modified = exportRulesToProject(dir, invariants, targetFilenames);
  return {
    modifiedFiles: modified,
    invariantsCount: invariants.length,
  };
}
