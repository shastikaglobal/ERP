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

let totalFixed = 0;
for (const file of walk(ROUTES_DIR)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace any 'if (supabase)' with 'if (false)'
  content = content.replace(/if\s*\(\s*supabase\s*\)/g, 'if (false /* supabase removed */)');
  
  // Comment out lines calling supabase methods
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.match(/supabase\./) || line.match(/await supabase/)) {
      if (!line.trim().startsWith('//')) {
        return '// [VPS Migration] ' + line;
      }
    }
    return line;
  });
  content = newLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
  }
}

console.log('Fixed supabase routes:', totalFixed);
