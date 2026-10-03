import { FileSignature, Invariant, Divergence, InvariantDiscoveryResult, LayerType, PackageRole } from "./types.js";

export interface DiscoveryOptions {
  dominanceThreshold?: number; // default: 0.75
  minSampleSize?: number;      // default: 5
  minFileCount?: number;       // default: 3
}

export function discoverInvariants(
  signatures: FileSignature[],
  options: DiscoveryOptions = {}
): InvariantDiscoveryResult {
  const dominanceThreshold = options.dominanceThreshold ?? 0.75;
  const minSampleSize = options.minSampleSize ?? 5;
  const minFileCount = options.minFileCount ?? 3;

  const dominantInvariants: Invariant[] = [];
  const unresolvedDivergences: Divergence[] = [];
  const insufficientSampleWarnings: string[] = [];

  // Group files by layer
  const filesByLayer: Record<string, FileSignature[]> = {};
  for (const sig of signatures) {
    if (!filesByLayer[sig.layer]) {
      filesByLayer[sig.layer] = [];
    }
    filesByLayer[sig.layer].push(sig);
  }

  // 1. Error Handling Invariants per Layer
  for (const [layer, files] of Object.entries(filesByLayer)) {
    if (layer === "unknown") continue;

    // Collect error-handling functions (exclude 'none')
    const errorFunctions: { file: string; strategy: string }[] = [];
    const filesWithErrors = new Set<string>();

    for (const file of files) {
      for (const fn of file.functions) {
        if (fn.errorStrategy !== "none") {
          errorFunctions.push({ file: file.filePath, strategy: fn.errorStrategy });
          filesWithErrors.add(file.filePath);
        }
      }
    }

    if (errorFunctions.length === 0) continue;

    if (errorFunctions.length < minSampleSize || filesWithErrors.size < minFileCount) {
      insufficientSampleWarnings.push(
        `Layer '${layer}' has ${errorFunctions.length} error-handling functions across ${filesWithErrors.size} files (minimum required: ${minSampleSize} functions across ${minFileCount} files).`
      );
      continue;
    }

    // Count strategies
    const counts: Record<string, number> = {};
    for (const item of errorFunctions) {
      counts[item.strategy] = (counts[item.strategy] || 0) + 1;
    }

    const total = errorFunctions.length;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topStrategy, topCount] = sorted[0];
    const topRatio = topCount / total;

    if (topRatio >= dominanceThreshold) {
      dominantInvariants.push({
        id: `inv-err-${layer}`,
        type: "error-handling",
        layer,
        dominantPattern: topStrategy,
        description: `Functions in layer '${layer}' standardly use '${topStrategy}' for error handling (${Math.round(topRatio * 100)}% dominance).`,
        confidence: topRatio,
        sampleSize: total,
        fileCount: filesWithErrors.size,
      });
    } else if (sorted.length > 1) {
      unresolvedDivergences.push({
        type: "error-handling",
        layer,
        description: `Unresolved style divergence in layer '${layer}': no single error strategy reaches ${Math.round(dominanceThreshold * 100)}% dominance.`,
        patterns: sorted.map(([pattern, count]) => ({
          pattern,
          count,
          percentage: Math.round((count / total) * 100),
        })),
      });
    }
  }

  // 2. Library Role Consistency (e.g. single validator, single HTTP client)
  const roleUsages: Record<PackageRole, { library: string; file: string }[]> = {
    http: [],
    validator: [],
    state: [],
    db: [],
  };

  for (const sig of signatures) {
    for (const imp of sig.imports) {
      if (imp.role) {
        roleUsages[imp.role].push({ library: imp.source, file: sig.filePath });
      }
    }
    for (const call of sig.globalCalls) {
      if (call === "fetch") {
        roleUsages.http.push({ library: "native-fetch", file: sig.filePath });
      }
    }
  }

  for (const [role, usages] of Object.entries(roleUsages) as [PackageRole, { library: string; file: string }[]][]) {
    if (usages.length === 0) continue;

    const uniqueFiles = new Set(usages.map(u => u.file));
    if (usages.length < minSampleSize || uniqueFiles.size < minFileCount) {
      continue;
    }

    const libCounts: Record<string, number> = {};
    for (const u of usages) {
      libCounts[u.library] = (libCounts[u.library] || 0) + 1;
    }

    const total = usages.length;
    const sorted = Object.entries(libCounts).sort((a, b) => b[1] - a[1]);
    const [topLib, topCount] = sorted[0];
    const topRatio = topCount / total;

    if (topRatio >= dominanceThreshold) {
      dominantInvariants.push({
        id: `inv-lib-${role}`,
        type: "library-role",
        dominantPattern: topLib,
        description: `Project standardizes on '${topLib}' for ${role} management (${Math.round(topRatio * 100)}% dominance).`,
        confidence: topRatio,
        sampleSize: total,
        fileCount: uniqueFiles.size,
      });
    } else if (sorted.length > 1) {
      unresolvedDivergences.push({
        type: "library-role",
        description: `Library redundancy detected for ${role}: project mixes multiple competing packages (${sorted.map(s => s[0]).join(", ")}).`,
        patterns: sorted.map(([pattern, count]) => ({
          pattern,
          count,
          percentage: Math.round((count / total) * 100),
        })),
      });
    }
  }

  return {
    dominantInvariants,
    unresolvedDivergences,
    insufficientSampleWarnings: insufficientSampleWarnings.length > 0 ? insufficientSampleWarnings : undefined,
  };
}
