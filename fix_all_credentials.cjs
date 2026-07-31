const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.match(/\{\s*credentials:\s*['"]include['"]\s*,\s*/)) {
      content = content.replace(/\{\s*credentials:\s*['"]include['"]\s*,\s*/g, "{ ");
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log('Fixed all duplicate credentials in src/');
