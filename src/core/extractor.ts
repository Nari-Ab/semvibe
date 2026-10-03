import ts from "typescript";
import { FileSignature, FunctionSignature, ImportSignature, LayerType, PackageRole, ErrorStrategy } from "./types.js";

export const PACKAGE_ROLES: Record<string, PackageRole> = {
  // HTTP clients
  "axios": "http",
  "got": "http",
  "node-fetch": "http",
  "ky": "http",
  "undici": "http",
  "superagent": "http",

  // Validators
  "zod": "validator",
  "yup": "validator",
  "joi": "validator",
  "valibot": "validator",
  "class-validator": "validator",

  // State managers
  "zustand": "state",
  "redux": "state",
  "@reduxjs/toolkit": "state",
  "mobx": "state",
  "jotai": "state",
  "recoil": "state",

  // DB
  "prisma": "db",
  "@prisma/client": "db",
  "drizzle-orm": "db",
  "typeorm": "db",
  "mongoose": "db",
  "pg": "db",
};

export function inferLayer(filePath: string): LayerType {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  
  if (
    normalized.includes(".service.") ||
    normalized.includes("/services/") ||
    normalized.startsWith("services/")
  ) return "service";

  if (
    normalized.includes(".controller.") ||
    normalized.includes("/controllers/") ||
    normalized.startsWith("controllers/") ||
    normalized.includes("/routes/") ||
    normalized.startsWith("routes/") ||
    normalized.includes("/api/") ||
    normalized.startsWith("api/") ||
    normalized.includes("route.ts") ||
    normalized.includes("route.js")
  ) return "controller";

  if (
    normalized.includes(".component.") ||
    normalized.includes("/components/") ||
    normalized.startsWith("components/") ||
    normalized.includes("/ui/") ||
    normalized.startsWith("ui/") ||
    normalized.includes("/views/") ||
    normalized.startsWith("views/") ||
    normalized.endsWith(".tsx") ||
    normalized.endsWith(".jsx")
  ) return "component";

  if (
    normalized.includes("/db/") ||
    normalized.startsWith("db/") ||
    normalized.includes("/database/") ||
    normalized.startsWith("database/") ||
    normalized.includes("/models/") ||
    normalized.startsWith("models/") ||
    normalized.includes("/repositories/") ||
    normalized.startsWith("repositories/")
  ) return "db";

  if (
    normalized.includes("/utils/") ||
    normalized.startsWith("utils/") ||
    normalized.includes("/helpers/") ||
    normalized.startsWith("helpers/") ||
    normalized.includes("/lib/") ||
    normalized.startsWith("lib/")
  ) return "util";

  return "unknown";
}

export function extractFileSignature(filePath: string, code: string): FileSignature {
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true, // setParentNodes
    ts.ScriptKind.TSX
  );

  const parseDiagnostics = (sourceFile as any).parseDiagnostics as ts.Diagnostic[] | undefined;
  const hasParseErrors = Boolean(parseDiagnostics && parseDiagnostics.length > 0);

  const imports: ImportSignature[] = [];
  const globalCalls: Set<string> = new Set();
  const functions: FunctionSignature[] = [];

  function getLineNumber(pos: number): number {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
  }

  // Helper to extract function signature & error strategy
  function analyzeFunction(
    node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration,
    name: string
  ) {
    let hasThrow = false;
    let hasResultPattern = false;
    let hasSuccessObj = false;
    let hasErrorObj = false;

    // Check return type annotation text if available
    if (node.type) {
      const typeText = node.type.getText(sourceFile);
      if (typeText.includes("Result<") || typeText.includes("Either<")) {
        hasResultPattern = true;
      }
    }

    // Traverse body for throws, returns, and ok/err calls
    function visitBody(child: ts.Node) {
      // Don't descend into nested function declarations — they will be analyzed on their own!
      if (
        child !== node &&
        (ts.isFunctionDeclaration(child) ||
          ts.isArrowFunction(child) ||
          ts.isFunctionExpression(child) ||
          ts.isMethodDeclaration(child))
      ) {
        return;
      }

      if (ts.isThrowStatement(child)) {
        hasThrow = true;
      }

      if (ts.isCallExpression(child)) {
        const text = child.expression.getText(sourceFile);
        if (text === "ok" || text === "err" || text === "Result.ok" || text === "Result.err") {
          hasResultPattern = true;
        }
      }

      if (ts.isReturnStatement(child) && child.expression && ts.isObjectLiteralExpression(child.expression)) {
        for (const prop of child.expression.properties) {
          if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
            const propName = prop.name.getText(sourceFile);
            if (propName === "success") {
              hasSuccessObj = true;
            } else if (propName === "error") {
              hasErrorObj = true;
            }
          }
        }
      }

      ts.forEachChild(child, visitBody);
    }

    if (node.body) {
      visitBody(node.body);
    }

    let errorStrategy: ErrorStrategy = "none";
    if (hasThrow) {
      errorStrategy = "throw";
    } else if (hasResultPattern) {
      errorStrategy = "result-pattern";
    } else if (hasSuccessObj) {
      errorStrategy = "success-boolean";
    } else if (hasErrorObj) {
      errorStrategy = "error-object";
    }

    functions.push({
      name,
      line: getLineNumber(node.getStart(sourceFile)),
      errorStrategy,
    });
  }

  function visit(node: ts.Node) {
    // 1. Imports
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      const isExternal = !moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/");
      const specifiers: string[] = [];

      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        for (const el of node.importClause.namedBindings.elements) {
          specifiers.push(el.name.text);
        }
      } else if (node.importClause?.name) {
        specifiers.push(node.importClause.name.text);
      }

      const role = isExternal ? PACKAGE_ROLES[moduleSpecifier] : undefined;

      imports.push({
        source: moduleSpecifier,
        isExternal,
        specifiers,
        role,
      });
    }

    // 2. Global calls (e.g. fetch)
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        const callee = node.expression.text;
        if (callee === "fetch") {
          globalCalls.add("fetch");
        }
      }
    }

    // 3. Functions
    if (ts.isFunctionDeclaration(node)) {
      const name = node.name ? node.name.text : "anonymous";
      analyzeFunction(node, name);
    } else if (ts.isMethodDeclaration(node)) {
      const name = node.name ? node.name.getText(sourceFile) : "method";
      analyzeFunction(node, name);
    } else if (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
      const name = node.name.getText(sourceFile);
      analyzeFunction(node.initializer, name);
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      // Standalone anonymous arrow function (not assigned to variable declaration handled above)
      if (!ts.isVariableDeclaration(node.parent)) {
        analyzeFunction(node, "anonymous");
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    filePath,
    layer: inferLayer(filePath),
    imports,
    globalCalls: Array.from(globalCalls),
    functions,
    hasParseErrors,
  };
}
