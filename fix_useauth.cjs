const fs = require('fs');
const path = require('path');

const crmDir = path.join(__dirname, 'src', 'pages', 'crm');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add `session` to `useAuth()` destructuring if not already there
  // e.g. const { roleSlugs } = useAuth(); -> const { roleSlugs, session } = useAuth();
  
  if (content.includes('useAuth()') && content.includes('session?.') && !content.includes('session } = useAuth()')) {
    content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useAuth\(\);/g, (match, p1) => {
      if (!p1.includes('session')) {
        return `const { ${p1}, session } = useAuth();`;
      }
      return match;
    });
  }

  // Clean up fetch calls that ended up with empty headers: `headers: {   },`
  content = content.replace(/headers:\s*\{\s*\},?/g, '');
  
  // Clean up empty fetch options if they just have credentials: 'include' and an empty headers inside:
  // e.g. { credentials: 'include', \n }
  content = content.replace(/,\s*\n\s*\}/g, '\n      }');

  // Also some files might not have had useAuth() imported or used, but they used session.
  if (content.includes('session?.') && !content.includes('const {') && !content.includes('useAuth')) {
      console.warn(`WARNING: File ${filePath} uses session but has no useAuth()`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed useAuth in ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(crmDir);
console.log('CRM useAuth fix complete.');
