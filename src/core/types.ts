export type LayerType = "component" | "controller" | "service" | "db" | "util" | "unknown";

export type PackageRole = "http" | "validator" | "state" | "db";

export type ErrorStrategy = "throw" | "result-pattern" | "success-boolean" | "error-object" | "none";

export interface ImportSignature {
  source: string;
  isExternal: boolean;
  specifiers: string[];
  role?: PackageRole;
}

export interface FunctionSignature {
  name: string;
  line: number;
  errorStrategy: ErrorStrategy;
}

export interface FileSignature {
  filePath: string;
  layer: LayerType;
  imports: ImportSignature[];
  globalCalls: string[];
  functions: FunctionSignature[];
  hasParseErrors: boolean;
}

export type InvariantType = "error-handling" | "layer-boundary" | "library-role";

export interface Invariant {
  id: string;
  type: InvariantType;
  layer?: string;
  dominantPattern: string;
  description: string;
  confidence: number;
  sampleSize: number;
  fileCount: number;
}

export interface DivergencePattern {
  pattern: string;
  count: number;
  percentage: number;
}

export interface Divergence {
  type: InvariantType;
  layer?: string;
  description: string;
  patterns: DivergencePattern[];
}

export interface InvariantDiscoveryResult {
  dominantInvariants: Invariant[];
  unresolvedDivergences: Divergence[];
  insufficientSampleWarnings?: string[];
}

export interface Outlier {
  filePath: string;
  functionName?: string;
  line: number;
  ruleId: string;
  observed: string;
  expected: string;
  codeSnippet: string;
}

export interface VerifiedViolation {
  outlier: Outlier;
  isTruePositive: boolean;
  confidence: number;
  reasoning: string;
  suggestedRemediation?: string;
}
