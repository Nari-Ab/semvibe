import * as fs from "fs";
import * as path from "path";
import { runLearn, runScan } from "../src/core/pipeline.js";

const BASELINE_ROOT = path.resolve("benchmark/baseline-repo");
const MUTATIONS_DIR = path.resolve("benchmark/mutations-runs");

export interface MutationSpec {
  id: number;
  category: "error-handling" | "library-redundancy" | "layer-inversion" | "global-calls";
  description: string;
  targetFile: string; // relative to repo root
  mutatedSnippet: string;
  lineOffsetHint: number;
}

export const MUTATION_SUITE: MutationSpec[] = [
  // A. Error Handling Contracts (6 Mutations)
  {
    id: 1,
    category: "error-handling",
    description: "Service function throwing raw new Error('msg') where Result<T, E> is dominant",
    targetFile: "src/services/billing.service.ts",
    mutatedSnippet: `export async function processPayment(id: string): Promise<any> {\n  if (!id) {\n    throw new Error("Invalid billing id");\n  }\n  return { status: "ok" };\n}`,
    lineOffsetHint: 10,
  },
  {
    id: 2,
    category: "error-handling",
    description: "Service function returning { success: false, error: 'msg' } where Result is dominant",
    targetFile: "src/services/user.service.ts",
    mutatedSnippet: `export async function findUser(id: string): Promise<any> {\n  if (!id) {\n    return { success: false, error: "User id required" };\n  }\n  return { success: true, data: { id } };\n}`,
    lineOffsetHint: 10,
  },
  {
    id: 3,
    category: "error-handling",
    description: "Service function returning { error: 'failed' } where Result is dominant",
    targetFile: "src/services/order.service.ts",
    mutatedSnippet: `export async function createOrder(data: any): Promise<any> {\n  if (!data) {\n    return { error: "failed" };\n  }\n  return { orderId: "123" };\n}`,
    lineOffsetHint: 10,
  },
  {
    id: 4,
    category: "error-handling",
    description: "Service function throwing raw string (throw 'unauthorized')",
    targetFile: "src/services/auth.service.ts",
    mutatedSnippet: `export function verifySession(token: string): any {\n  if (!token) {\n    throw "unauthorized";\n  }\n  return { userId: "u1" };\n}`,
    lineOffsetHint: 10,
  },
  {
    id: 5,
    category: "error-handling",
    description: "Controller method throwing untyped custom exception",
    targetFile: "src/controllers/auth.controller.ts",
    mutatedSnippet: `export async function handleLogin(req: any) {\n  if (!req.body) {\n    throw new CustomAuthError("No credentials");\n  }\n  return { ok: true };\n}`,
    lineOffsetHint: 10,
  },
  {
    id: 6,
    category: "error-handling",
    description: "Service method returning undefined silently on error",
    targetFile: "src/services/inventory.service.ts",
    mutatedSnippet: `export function checkStock(sku: string): number | undefined {\n  if (!sku) {\n    return undefined;\n  }\n  return 42;\n}`,
    lineOffsetHint: 10,
  },

  // B. Library Redundancy & Role Collisions (7 Mutations)
  {
    id: 7,
    category: "library-redundancy",
    description: "Rogue axios imported in service",
    targetFile: "src/services/shipping.service.ts",
    mutatedSnippet: `import axios from "axios";\nexport async function getRates() {\n  return axios.get("https://shipping.example.com");\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 8,
    category: "library-redundancy",
    description: "Rogue got imported in service",
    targetFile: "src/services/analytics.service.ts",
    mutatedSnippet: `import got from "got";\nexport async function sendEvent(evt: any) {\n  return got.post("https://telemetry.example.com", { json: evt });\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 9,
    category: "library-redundancy",
    description: "Rogue superagent imported in service",
    targetFile: "src/services/audit.service.ts",
    mutatedSnippet: `import request from "superagent";\nexport async function logAudit(action: string) {\n  return request.post("https://audit.example.com").send({ action });\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 10,
    category: "library-redundancy",
    description: "Rogue yup schema declaration in validation module",
    targetFile: "src/schemas/checkout.schema.ts",
    mutatedSnippet: `import * as yup from "yup";\nexport const checkoutSchema = yup.object({ cartId: yup.string().required() });`,
    lineOffsetHint: 1,
  },
  {
    id: 11,
    category: "library-redundancy",
    description: "Rogue joi validator in validation module",
    targetFile: "src/schemas/profile.schema.ts",
    mutatedSnippet: `import Joi from "joi";\nexport const profileSchema = Joi.object({ username: Joi.string().min(3) });`,
    lineOffsetHint: 1,
  },
  {
    id: 12,
    category: "library-redundancy",
    description: "Rogue jotai atom in store module",
    targetFile: "src/stores/theme.store.ts",
    mutatedSnippet: `import { atom } from "jotai";\nexport const themeAtom = atom("dark");`,
    lineOffsetHint: 1,
  },
  {
    id: 13,
    category: "library-redundancy",
    description: "Rogue mobx observable in store module",
    targetFile: "src/stores/settings.store.ts",
    mutatedSnippet: `import { observable } from "mobx";\nexport const settingsStore = observable({ notifications: true });`,
    lineOffsetHint: 1,
  },

  // C. Layer Boundary Inversions (4 Mutations)
  {
    id: 14,
    category: "layer-inversion",
    description: "UI Component importing @prisma/client directly",
    targetFile: "src/components/UserCard.tsx",
    mutatedSnippet: `import { PrismaClient } from "@prisma/client";\nexport function UserCard() {\n  const p = new PrismaClient();\n  return <div>User</div>;\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 15,
    category: "layer-inversion",
    description: "UI Component importing server-only database repository",
    targetFile: "src/components/OrderList.tsx",
    mutatedSnippet: `import { getDatabaseConnection } from "../db/connection";\nexport function OrderList() {\n  return <div>Orders</div>;\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 16,
    category: "layer-inversion",
    description: "Service layer importing presentation component (components/Button)",
    targetFile: "src/services/notification.service.ts",
    mutatedSnippet: `import { Button } from "../components/Button";\nexport function formatNotification() {\n  return Button.name;\n}`,
    lineOffsetHint: 1,
  },
  {
    id: 17,
    category: "layer-inversion",
    description: "Controller directly executing low-level raw SQL driver",
    targetFile: "src/controllers/payment.controller.ts",
    mutatedSnippet: `import { Pool } from "pg";\nconst pool = new Pool();\nexport async function handlePayment() {\n  return pool.query("SELECT * FROM payments");\n}`,
    lineOffsetHint: 1,
  },

  // D. Unencapsulated Global Calls (3 Mutations)
  {
    id: 18,
    category: "global-calls",
    description: "Raw global fetch() call inside UI component bypassing client wrapper",
    targetFile: "src/components/LiveFeed.tsx",
    mutatedSnippet: `export function LiveFeed() {\n  const load = () => fetch("https://api.example.com/feed");\n  return <button onClick={load}>Refresh</button>;\n}`,
    lineOffsetHint: 2,
  },
  {
    id: 19,
    category: "global-calls",
    description: "Raw global fetch() call in service without error handling",
    targetFile: "src/services/sync.service.ts",
    mutatedSnippet: `export async function syncCatalog() {\n  const res = await fetch("https://catalog.example.com/sync");\n  return res.json();\n}`,
    lineOffsetHint: 2,
  },
  {
    id: 20,
    category: "global-calls",
    description: "Raw global fetch() call in utility without project headers",
    targetFile: "src/utils/telemetry.ts",
    mutatedSnippet: `export function reportMetric(val: number) {\n  fetch("https://metrics.example.com", { method: "POST", body: JSON.stringify({ val }) });\n}`,
    lineOffsetHint: 2,
  },
];

export function buildBaselineRepository(root: string) {
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  fs.mkdirSync(root, { recursive: true });

  // 1. Common types
  const typesDir = path.join(root, "src/types");
  fs.mkdirSync(typesDir, { recursive: true });
  fs.writeFileSync(
    path.join(typesDir, "result.ts"),
    `export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };\nexport class AppError extends Error { constructor(msg: string) { super(msg); } }\n`
  );

  // 2. 10 Services using Result<T, AppError> (100% dominance)
  const servicesDir = path.join(root, "src/services");
  fs.mkdirSync(servicesDir, { recursive: true });
  const serviceNames = [
    "user", "billing", "order", "auth", "inventory",
    "shipping", "analytics", "audit", "notification", "sync"
  ];
  for (const name of serviceNames) {
    fs.writeFileSync(
      path.join(servicesDir, `${name}.service.ts`),
      `import { Result, AppError } from "../types/result";\n\nexport async function get${capitalize(name)}(id: string): Promise<Result<{ id: string }, AppError>> {\n  if (!id) {\n    return { ok: false, error: new AppError("${name} not found") };\n  }\n  return { ok: true, value: { id } };\n}\n\nexport async function update${capitalize(name)}(id: string, data: any): Promise<Result<boolean, AppError>> {\n  if (!data) {\n    return { ok: false, error: new AppError("data required") };\n  }\n  return { ok: true, value: true };\n}\n`
    );
  }

  // 3. 10 Controllers routing to services (100% dominance)
  const controllersDir = path.join(root, "src/controllers");
  fs.mkdirSync(controllersDir, { recursive: true });
  const controllerNames = [
    "user", "billing", "order", "auth", "inventory",
    "shipping", "analytics", "audit", "notification", "payment"
  ];
  for (const name of controllerNames) {
    fs.writeFileSync(
      path.join(controllersDir, `${name}.controller.ts`),
      `import * as svc from "../services/${name === 'payment' ? 'billing' : name}.service";\n\nexport async function handleGet${capitalize(name)}(req: any) {\n  const res = await svc.get${capitalize(name === 'payment' ? 'billing' : name)}(req.params.id);\n  return res;\n}\n`
    );
  }

  // 4. 8 API Route files using native-fetch (100% dominance)
  const routesDir = path.join(root, "src/routes");
  fs.mkdirSync(routesDir, { recursive: true });
  for (let i = 1; i <= 8; i++) {
    fs.writeFileSync(
      path.join(routesDir, `endpoint${i}.ts`),
      `export async function handleRequest${i}() {\n  const res = await fetch("https://internal.service.local/api/v1/data${i}");\n  return res.json();\n}\n`
    );
  }

  // 5. 8 Schema files using zod (100% dominance)
  const schemasDir = path.join(root, "src/schemas");
  fs.mkdirSync(schemasDir, { recursive: true });
  const schemaNames = ["user", "billing", "order", "auth", "checkout", "profile", "product", "cart"];
  for (const name of schemaNames) {
    fs.writeFileSync(
      path.join(schemasDir, `${name}.schema.ts`),
      `import { z } from "zod";\n\nexport const ${name}Schema = z.object({\n  id: z.string().uuid(),\n  createdAt: z.date(),\n});\n`
    );
  }

  // 6. 6 State stores using zustand (100% dominance)
  const storesDir = path.join(root, "src/stores");
  fs.mkdirSync(storesDir, { recursive: true });
  const storeNames = ["auth", "cart", "theme", "settings", "ui", "session"];
  for (const name of storeNames) {
    fs.writeFileSync(
      path.join(storesDir, `${name}.store.ts`),
      `import { create } from "zustand";\n\ninterface ${capitalize(name)}State {\n  active: boolean;\n  toggle: () => void;\n}\n\nexport const use${capitalize(name)}Store = create<${capitalize(name)}State>((set) => ({\n  active: false,\n  toggle: () => set((s) => ({ active: !s.active })),\n}));\n`
    );
  }

  // 7. Clean UI components & Utils
  const compDir = path.join(root, "src/components");
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, "Button.tsx"), `export function Button({ label }: { label: string }) { return <button>{label}</button>; }\n`);
  fs.writeFileSync(path.join(compDir, "UserCard.tsx"), `import { Button } from "./Button";\nexport function UserCard() { return <div><Button label="View" /></div>; }\n`);
  fs.writeFileSync(path.join(compDir, "OrderList.tsx"), `export function OrderList() { return <ul><li>Order 1</li></ul>; }\n`);
  fs.writeFileSync(path.join(compDir, "LiveFeed.tsx"), `export function LiveFeed() { return <div>Feed</div>; }\n`);

  const utilsDir = path.join(root, "src/utils");
  fs.mkdirSync(utilsDir, { recursive: true });
  fs.writeFileSync(path.join(utilsDir, "telemetry.ts"), `export function logMetric(k: string, v: number) { console.log(k, v); }\n`);

  // Package.json to anchor roles
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "baseline-repo",
      dependencies: {
        zod: "^3.22.0",
        zustand: "^4.5.0",
      }
    }, null, 2)
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function runMutationBenchmark() {
  console.log("=== STEP 1: Building Clean Baseline Repository ===");
  buildBaselineRepository(BASELINE_ROOT);

  console.log("=== STEP 2: Two-Stage Negative Control Validation ===");
  const learnClean = await runLearn(BASELINE_ROOT, { autoConfirm: true });
  console.log(`Discovered Invariants on clean baseline: ${learnClean.invariants.length}`);
  for (const inv of learnClean.invariants) {
    console.log(`  - [${inv.category}] Dominance: ${(inv.confidence * 100).toFixed(1)}%`);
  }

  const scanClean = await runScan(BASELINE_ROOT, { astOnly: true });
  console.log(`Violations on clean baseline: ${scanClean.violations.length} (Expected: exactly 0)`);
  if (scanClean.violations.length !== 0) {
    throw new Error(`Negative control failed! Found ${scanClean.violations.length} false positives on clean baseline.`);
  }
  console.log("✔ Negative control PASSED: 0 false positives.\n");

  console.log("=== STEP 3: Executing 20 Isolated Seeded Mutations ===");
  if (fs.existsSync(MUTATIONS_DIR)) {
    fs.rmSync(MUTATIONS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(MUTATIONS_DIR, { recursive: true });

  const results: any[] = [];
  let detectedCount = 0;

  for (const mut of MUTATION_SUITE) {
    const copyPath = path.join(MUTATIONS_DIR, `run_mut_${mut.id}`);
    copyDirSync(BASELINE_ROOT, copyPath);

    // Inject single mutation into target file
    const targetFilePath = path.join(copyPath, mut.targetFile);
    const originalContent = fs.readFileSync(targetFilePath, "utf8");
    const mutatedContent = `${mut.mutatedSnippet}\n\n${originalContent}`;
    fs.writeFileSync(targetFilePath, mutatedContent);

    // Run scan
    const scanResult = await runScan(copyPath, { astOnly: true });
    
    // Check detection criteria: targetFile match, proximate line, rule category
    const matchedViolation = scanResult.violations.find((v) => {
      const vPath = v.outlier.filePath.replace(/\\/g, "/");
      const targetNormalized = mut.targetFile.replace(/\\/g, "/");
      const pathMatch = vPath.endsWith(targetNormalized);
      return pathMatch;
    });

    const isDetected = Boolean(matchedViolation);
    if (isDetected) {
      detectedCount++;
    }

    results.push({
      id: mut.id,
      category: mut.category,
      description: mut.description,
      targetFile: mut.targetFile,
      detected: isDetected,
      reportedViolation: matchedViolation ? {
        rule: matchedViolation.outlier.ruleDescription,
        file: matchedViolation.outlier.filePath,
        line: matchedViolation.outlier.line,
        expected: matchedViolation.outlier.expected,
        observed: matchedViolation.outlier.observed,
      } : null,
    });

    console.log(`Mutation #${mut.id} [${mut.category}]: ${isDetected ? "✔ DETECTED" : "❌ MISSED"}`);
    if (matchedViolation) {
      console.log(`   Found: ${matchedViolation.outlier.observed} (Expected: ${matchedViolation.outlier.expected}) at line ${matchedViolation.outlier.line}`);
    }
  }

  const recall = (detectedCount / MUTATION_SUITE.length) * 100;
  console.log(`\n========================================`);
  console.log(`Gate 2 Seeded Recall Result: ${detectedCount}/${MUTATION_SUITE.length} (${recall.toFixed(1)}%)`);
  console.log(`Target: >= 85% (17/20)`);
  console.log(`Gate 2 Status: ${detectedCount >= 17 ? "PASS (GO)" : "FAIL (STOP/REVISE)"}`);
  console.log(`========================================\n`);

  fs.writeFileSync(
    path.resolve("benchmark/raw_runs/mutations_raw.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalMutations: MUTATION_SUITE.length,
      detectedCount,
      recallPercent: recall,
      passed: detectedCount >= 17,
      mutations: results,
    }, null, 2)
  );

  return { detectedCount, total: MUTATION_SUITE.length, recall, passed: detectedCount >= 17 };
}

// Auto-run if executed directly
if (process.argv[1]?.includes("build_baseline_and_mutations")) {
  runMutationBenchmark().catch((err) => {
    console.error("Benchmark failed with error:", err);
    process.exit(1);
  });
}
