import fs from 'fs';
import path from 'path';

interface ConventionAuditResult {
  repo: string;
  slicePath: string;
  conventions: {
    errorHandling: {
      dominant: string;
      dominantCount: number;
      minorityMatches: Array<{ file: string; line: number; text: string }>;
    };
    httpClient: {
      dominant: string;
      dominantCount: number;
      minorityMatches: Array<{ file: string; line: number; text: string }>;
    };
    validation: {
      dominant: string;
      dominantCount: number;
      minorityMatches: Array<{ file: string; line: number; text: string }>;
    };
  };
}

function getAllFiles(dir: string, ext = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'dist' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function auditRepo(repoName: string, sliceDir: string): ConventionAuditResult {
  const files = getAllFiles(sliceDir);
  
  // 1. Error Handling: throw vs return { error } / new Error vs Custom
  let throwCount = 0;
  let returnErrorCount = 0;
  const errorMinority: Array<{ file: string; line: number; text: string }> = [];

  // 2. HTTP Client: fetch vs axios vs ky vs got
  let fetchCount = 0;
  let axiosCount = 0;
  let kyCount = 0;
  const httpMinority: Array<{ file: string; line: number; text: string }> = [];

  // 3. Validation: zod vs yup vs joi vs valibot
  let zodCount = 0;
  let otherValCount = 0;
  const valMinority: Array<{ file: string; line: number; text: string }> = [];

  for (const f of files) {
    const rel = path.relative(sliceDir, f);
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      const lineNum = idx + 1;
      const trimmed = l.trim();

      // Error handling checks
      if (/\bthrow\s+new\s+/.test(trimmed)) {
        throwCount++;
      } else if (/\breturn\s+\{\s*(?:error|err|success:\s*false)\b/.test(trimmed) || /return\s+new\s+Error/.test(trimmed)) {
        returnErrorCount++;
        errorMinority.push({ file: rel, line: lineNum, text: trimmed });
      }

      // HTTP Client
      if (/\bfrom\s+['"]axios['"]|\brequire\(['"]axios['"]\)/.test(trimmed)) {
        axiosCount++;
        httpMinority.push({ file: rel, line: lineNum, text: trimmed });
      } else if (/\bfrom\s+['"]ky['"]|\brequire\(['"]ky['"]\)/.test(trimmed)) {
        kyCount++;
        httpMinority.push({ file: rel, line: lineNum, text: trimmed });
      } else if (/\bfetch\(/.test(trimmed)) {
        fetchCount++;
      }

      // Validation
      if (/\bfrom\s+['"]zod['"]|\brequire\(['"]zod['"]\)/.test(trimmed)) {
        zodCount++;
      } else if (/\bfrom\s+['"](?:yup|joi|valibot|superstruct)['"]/.test(trimmed)) {
        otherValCount++;
        valMinority.push({ file: rel, line: lineNum, text: trimmed });
      }
    });
  }

  const dominantError = throwCount >= returnErrorCount ? `throw (${throwCount})` : `return error (${returnErrorCount})`;
  const dominantHttp = fetchCount >= (axiosCount + kyCount) ? `fetch (${fetchCount})` : `libraries (${axiosCount + kyCount})`;
  const dominantVal = zodCount >= otherValCount ? `zod (${zodCount})` : `other (${otherValCount})`;

  return {
    repo: repoName,
    slicePath: sliceDir,
    conventions: {
      errorHandling: {
        dominant: dominantError,
        dominantCount: Math.max(throwCount, returnErrorCount),
        minorityMatches: errorMinority.slice(0, 30), // capped
      },
      httpClient: {
        dominant: dominantHttp,
        dominantCount: fetchCount,
        minorityMatches: httpMinority,
      },
      validation: {
        dominant: dominantVal,
        dominantCount: zodCount,
        minorityMatches: valMinority,
      },
    },
  };
}

export function runAudits() {
  const repos = [
    { name: 'dubinc/dub', path: 'benchmark/repos/dub/apps/web' },
    { name: 'leerob/next-saas-starter', path: 'benchmark/repos/next-saas-starter' },
    { name: 'steven-tey/precedent', path: 'benchmark/repos/precedent' },
    { name: 't3-oss/create-t3-app', path: 'benchmark/repos/create-t3-app/cli/src' },
  ];

  if (fs.existsSync('benchmark/repos/calcom')) {
    repos.push({ name: 'calcom/cal.com (packages/trpc)', path: 'benchmark/repos/calcom/packages/trpc' });
    repos.push({ name: 'calcom/cal.com (packages/features)', path: 'benchmark/repos/calcom/packages/features' });
  }

  const results = repos.map(r => auditRepo(r.name, r.path));
  fs.writeFileSync('benchmark/raw_runs/convention_audit_raw.json', JSON.stringify(results, null, 2));
  console.log('Audits completed and saved to benchmark/raw_runs/convention_audit_raw.json');
}

runAudits();
