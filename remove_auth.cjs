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
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Bearer ${session?.access_token}')) {
    const newContent = content.replace(/['"]?Authorization['"]?\s*:\s*\`Bearer \$\{session\?\.access_token\}\`\,?\s*/g, '');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      changed++;
    }
  }
});
console.log('Modified ' + changed + ' files.');
