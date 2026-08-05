const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let modifiedCount = 0;

for (let file of files) {
  // Do not modify api.ts itself
  if (file.endsWith('api.ts') || file.endsWith('api.js')) continue;

  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;

  // Replace strictly word boundary 'fetch(' but not apiFetch or things like that
  // Must capture what precedes it to ensure it's a bare fetch
  // e.g. await fetch(  => await apiFetch(
  // return fetch( => return apiFetch(
  // Promise.all([fetch( => Promise.all([apiFetch(
  // We can use regex \bfetch\(
  
  if (/\bfetch\s*\(/.test(code)) {
    code = code.replace(/\bfetch\s*\(/g, "apiFetch(");
    
    // Add import if not present
    if (!code.includes("import { apiFetch } from")) {
      // Find the first line after imports, or just add at top
      // Wait, we can safely put it at the very top
      let importStatement = `import { apiFetch } from "@/lib/api";\n`;
      code = importStatement + code;
    }
  }

  if (code !== originalCode) {
    fs.writeFileSync(file, code, 'utf8');
    modifiedCount++;
  }
}

console.log('Replaced fetch in files:', modifiedCount);
