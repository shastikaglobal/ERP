const fs = require('fs');
const path = require('path');

function deduplicate(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && !fullPath.includes('node_modules')) {
      deduplicate(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        let hasUseAuthImport = false;
        let modified = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('useAuth') && lines[i].includes('import ')) {
            if (hasUseAuthImport) {
              lines[i] = '';
              modified = true;
            } else {
              hasUseAuthImport = true;
            }
          }
        }
        
        if (modified) {
          fs.writeFileSync(fullPath, lines.join('\n'));
          console.log('Deduplicated useAuth import in:', fullPath);
        }
      } catch(e){}
    }
  });
}
deduplicate('src');
