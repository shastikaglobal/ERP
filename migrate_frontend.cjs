const fs = require('fs');
const path = require('path');

const dirsToMigrate = [
  path.join(__dirname, 'src', 'pages', 'crm'),
  path.join(__dirname, 'src', 'hooks')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove supabase import
  content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*['"]@\/integrations\/supabase\/client['"];?\n?/g, '');

  // 2. Remove session retrieval
  content = content.replace(/const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*\}\s*=\s*await\s*supabase\.auth\.getSession\(\);\n?/g, '');
  content = content.replace(/if\s*\(!session\)\s*(return|throw new Error\([^)]+\));?\n?/g, '');

  // 3. Remove Authorization header from fetch calls
  content = content.replace(/'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`/g, '');
  // Clean up empty headers objects if any, or dangling commas
  content = content.replace(/headers:\s*\{\s*,\s*/g, 'headers: {');
  content = content.replace(/,\s*'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`/g, '');
  content = content.replace(/'Authorization':\s*`Bearer \$\{session(?:\??\.access_token)?\}`\s*,/g, '');
  
  // 4. Ensure fetch calls have credentials: 'include'
  content = content.replace(/(fetch\([^,]+,\s*\{)([^}]+)\}/g, (match, p1, p2) => {
    if (!p2.includes('credentials')) {
      return `${p1} credentials: 'include', ${p2} }`;
    }
    return match;
  });
  
  // Clean up headers: {}
  content = content.replace(/headers:\s*\{\s*\}(,)?/g, '');
  content = content.replace(/headers:\s*\{\s*\},?/g, '');
  
  // Clean up empty fetch options if they just have credentials: 'include' and an empty headers inside:
  content = content.replace(/,\s*\n\s*\}/g, '\n      }');

  // 5. Remove supabase.channel() logic
  content = content.replace(/const\s+channel\s*=\s*supabase\s*\.channel[\s\S]*?\.subscribe\(\);/g, '');
  content = content.replace(/return\s*\(\)\s*=>\s*\{\s*supabase\.removeChannel\(channel\);\s*\};/g, '');
  
  // Also remove simple `.unsubscribe()` logic
  content = content.replace(/supabase\.removeChannel\(channel\);/g, '');

  // 6. Fix useAuth
  if (content.includes('useAuth()') && content.includes('session?.') && !content.includes('session } = useAuth()')) {
    content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useAuth\(\);/g, (match, p1) => {
      if (!p1.includes('session')) {
        return `const { ${p1}, session } = useAuth();`;
      }
      return match;
    });
  }

  if (content.includes('session?.') && !content.includes('const {') && !content.includes('useAuth')) {
      console.warn(`WARNING: File ${filePath} uses session but has no useAuth()`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
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

for (const dir of dirsToMigrate) {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
}
console.log('Frontend migration complete for specified directories.');
