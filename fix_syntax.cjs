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
      if (
        trimmed.startsWith('.from(') ||
        trimmed.startsWith('.select(') ||
        trimmed.startsWith('.insert(') ||
        trimmed.startsWith('.update(') ||
        trimmed.startsWith('.delete(') ||
        trimmed.startsWith('.eq(') ||
        trimmed.startsWith('.single(') ||
        trimmed.startsWith('.maybeSingle(') ||
        trimmed.startsWith('.order(') ||
        trimmed.startsWith('.limit(') ||
        trimmed.startsWith('.then(') ||
        trimmed.startsWith('.catch(')
      ) {
        // Comment out this continuation line
        lines[i] = '// [VPS Migration] ' + lines[i];
        changed = true;
      } else if (trimmed === '' || trimmed.startsWith('//')) {
        // keep going
      } else {
        inCommentedBlock = false; // block ended
      }
    }
  }

  // Final sweep for any raw supabase calls we missed (like inline analytics ones)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('supabase.from') && !lines[i].trim().startsWith('//')) {
      lines[i] = '// [VPS Migration] ' + lines[i];
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed syntax in:', file);
  }
}
