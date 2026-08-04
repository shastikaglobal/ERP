const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'adms-sync/routes');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

for (const file of walk(ROUTES_DIR)) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  let inCommentedBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    
    // If the line starts with a commented supabase call
    if (trimmed.startsWith('// [VPS Migration]') && trimmed.includes('supabase')) {
      inCommentedBlock = true;
      continue;
    }

    if (inCommentedBlock) {
      // If line starts with a dot method call like .from( or .or(
      if (/^\.[a-zA-Z0-9_]+\(/.test(trimmed) || /^\.[a-zA-Z0-9_]+\./.test(trimmed)) {
        lines[i] = '// [VPS Migration] ' + lines[i];
        changed = true;
      } else if (trimmed === '' || trimmed.startsWith('//')) {
        // keep going
      } else {
        inCommentedBlock = false; // block ended
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed syntax in:', file);
  }
}
