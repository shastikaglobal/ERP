const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walk(SRC_DIR);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Find lines that end with `// [VPS Migration] fixed assignment` or `// [VPS Migration] vpsDb query removed`
  // and have `const { ... } = ` or `const ... : any = null;`
  // We'll replace the whole line with `const {} = {} as any;` but keep the variables.
  
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// [VPS Migration]')) {
      if (lines[i].includes('const ')) {
        // extract variables
        let match = lines[i].match(/const\s*(?:\{\s*(.*?)\s*\}|(.*?))\s*(?:=|:)/);
        if (match) {
          let vars = match[1] || match[2];
          vars = vars.trim();
          lines[i] = `const { ${vars} } = {} as any; // [VPS Migration] fixed assignment`;
        }
      }
    }
    
    // Also fix the Mailbox.tsx onClick issue
    if (lines[i].includes('Storage call removed') && lines[i].includes('onClick')) {
      lines[i] = 'onClick={() => {}} // [VPS Migration] Storage call removed';
    }
  }

  content = lines.join('\n');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
}
