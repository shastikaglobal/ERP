const fs = require('fs');
const path = require('path');

const srcDir = 'src/pages';
const files = [];

function findFiles(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
}

findFiles(srcDir);

const badPatterns = [
  { pattern: /vpsDb\s*\.\s*(from|channel|storage|select)/, label: 'vpsDb method call (legacy Supabase - will crash)' },
  { pattern: /legacyDb\s*\./, label: 'legacyDb call (dead)' },
  { pattern: /empSession\?\.\s*access_token/, label: 'undefined empSession reference' },
  { pattern: /const\s*\{\s*user\s*\}\s*=\s*\{\}\s*as\s*any/, label: 'stub user object (always undefined)' },
  { pattern: /const\s*sessionData\s*=\s*\{\s*session:\s*null\s*\}/, label: 'stub sessionData (always null token)' },
];

const results = { broken: [], clean: [] };

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const issues = [];

  for (const { pattern, label } of badPatterns) {
    if (pattern.test(content)) {
      issues.push(label);
    }
  }

  const relFile = path.relative(srcDir, file).replace(/\\/g, '/');

  if (issues.length > 0) {
    results.broken.push({ file: relFile, issues });
  } else {
    results.clean.push(relFile);
  }
}

console.log(JSON.stringify(results, null, 2));
