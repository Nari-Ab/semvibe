const fs = require('fs');
const path = require('path');

// Simple deterministic PRNG (Mulberry32)
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseSemvibeTxt(filePath, repoName, repoRoot) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const regex = /#\d+\s+([^:\s]+):(\d+)\s+in\s+([^\n]+)\n\s+Observed:\s+([^\s|]+)\s+\|\s+Expected:\s+([^\n]+)\n\s+Reason:\s+([^\n]+)\n\s+Fix:\s+([^\n]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const relFile = match[1];
    const line = parseInt(match[2], 10);
    const fn = match[3];
    const observed = match[4];
    const expected = match[5];
    
    // Read code snippet if file exists
    let snippet = '';
    const fullPath = path.join(repoRoot, relFile);
    if (fs.existsSync(fullPath)) {
      try {
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
        snippet = (lines[line - 1] || '').trim();
      } catch (e) {}
    }

    findings.push({
      tool: 'semvibe',
      repository: repoName,
      file: relFile,
      line: line,
      ruleOrInvariant: `Convention: expected ${expected}, observed ${observed}`,
      description: `Deviation in ${fn}: uses ${observed} instead of dominant ${expected}`,
      snippet: snippet,
    });
  }
  return findings;
}

function parseDriftJson(filePath, repoName, repoRoot) {
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const findings = [];
  for (const item of raw) {
    const loc = item.location || {};
    const relFile = loc.file_path || item.file_path || 'unknown';
    const line = loc.line_number || item.line_number || 1;
    const rule = item.rule_id || item.pattern_id || item.signal_type || 'drift-pattern';
    const desc = item.message || item.description || item.title || 'Architectural drift signal';
    
    let snippet = '';
    const fullPath = path.join(repoRoot, relFile);
    if (fs.existsSync(fullPath)) {
      try {
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
        snippet = (lines[line - 1] || '').trim();
      } catch (e) {}
    }

    findings.push({
      tool: 'drift',
      repository: repoName,
      file: relFile,
      line: line,
      ruleOrInvariant: rule,
      description: desc,
      snippet: snippet,
    });
  }
  return findings;
}

function compileBlindPool() {
  const allFindings = [];

  // Semvibe findings
  allFindings.push(...parseSemvibeTxt('benchmark/raw_runs/semvibe_dub.txt', 'dubinc/dub', 'benchmark/repos/dub/apps/web'));
  if (fs.existsSync('benchmark/raw_runs/semvibe_calcom.txt')) {
    allFindings.push(...parseSemvibeTxt('benchmark/raw_runs/semvibe_calcom.txt', 'calcom/cal.com', 'benchmark/repos/calcom'));
  }

  // Drift findings
  allFindings.push(...parseDriftJson('benchmark/raw_runs/drift_dub.json', 'dubinc/dub', 'benchmark/repos/dub/apps/web'));
  if (fs.existsSync('benchmark/raw_runs/drift_calcom.json')) {
    allFindings.push(...parseDriftJson('benchmark/raw_runs/drift_calcom.json', 'calcom/cal.com', 'benchmark/repos/calcom'));
  }
  allFindings.push(...parseDriftJson('benchmark/raw_runs/drift_next_saas_starter.json', 'leerob/next-saas-starter', 'benchmark/repos/next-saas-starter'));
  allFindings.push(...parseDriftJson('benchmark/raw_runs/drift_precedent.json', 'steven-tey/precedent', 'benchmark/repos/precedent'));
  allFindings.push(...parseDriftJson('benchmark/raw_runs/drift_create_t3_app.json', 't3-oss/create-t3-app', 'benchmark/repos/create-t3-app/cli'));

  console.log(`Total raw pooled findings: ${allFindings.length}`);
  const semvibeTotal = allFindings.filter(f => f.tool === 'semvibe').length;
  const driftTotal = allFindings.filter(f => f.tool === 'drift').length;
  console.log(`Semvibe: ${semvibeTotal}, Drift: ${driftTotal}`);

  // Stratified sampling: Take up to 25 from Semvibe and up to 35 from Drift
  const rand = mulberry32(42);
  const semvibeItems = allFindings.filter(f => f.tool === 'semvibe');
  const driftItems = allFindings.filter(f => f.tool === 'drift');

  // Shuffle arrays
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  shuffle(semvibeItems);
  shuffle(driftItems);

  // Take sample for blind evaluation
  // Semvibe has ~21-25 findings; include all Semvibe to maximize power, plus equal or slightly larger Drift sample
  const sampleSemvibe = semvibeItems.slice(0, 25);
  const sampleDrift = driftItems.slice(0, 35);
  const combinedSample = shuffle([...sampleSemvibe, ...sampleDrift]);

  console.log(`Selected blind sample size: ${combinedSample.length} (${sampleSemvibe.length} Semvibe, ${sampleDrift.length} Drift)`);

  const blindRows = [];
  const secretMap = [];

  combinedSample.forEach((item, idx) => {
    const id = `FND-${String(idx + 1).padStart(3, '0')}`;
    secretMap.push({
      id: id,
      tool: item.tool,
      repository: item.repository,
      file: item.file,
      line: item.line,
      rule: item.ruleOrInvariant,
      originalDesc: item.description,
    });

    blindRows.push({
      id: id,
      repository: item.repository,
      file: item.file,
      line: item.line,
      description: item.description.replace(/drift|semvibe/gi, 'analyzer'),
      snippet: (item.snippet || '').replace(/"/g, '""'),
    });
  });

  // Write blind CSV
  let csv = 'id,repository,file,line,description,snippet\n';
  for (const r of blindRows) {
    csv += `"${r.id}","${r.repository}","${r.file}",${r.line},"${r.description.replace(/"/g, '""')}","${r.snippet}"\n`;
  }
  fs.writeFileSync('benchmark/blind_pool.csv', csv);
  fs.writeFileSync('benchmark/secret_ground_truth_map.json', JSON.stringify(secretMap, null, 2));
  console.log('Saved benchmark/blind_pool.csv and benchmark/secret_ground_truth_map.json');
}

if (require.main === module) {
  compileBlindPool();
}

module.exports = { compileBlindPool };
