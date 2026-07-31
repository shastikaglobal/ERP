const fs = require('fs');
const path = require('path');

const directories = [
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\quotations',
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\shipments',
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm',
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\procurement',
    'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\farmers'
];

function cleanFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    let original = content;

    content = content.replace(/const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+supabase[^;]+;/g, "const data = null; const error = new Error('Supabase removed');");
    content = content.replace(/const\s+\{\s*data\s*:\s*[a-zA-Z0-9_]+\s*,\s*error\s*:\s*[a-zA-Z0-9_]+\s*\}\s*=\s*await\s+supabase[^;]+;/g, "const error = new Error('Supabase removed');");
    content = content.replace(/const\s+\{\s*data[^}]*\}\s*=\s*await\s+supabase[^;]+;/g, "const data = null; /* Removed Supabase */");
    content = content.replace(/const\s+\{\s*error[^}]*\}\s*=\s*await\s+supabase[^;]+;/g, "const error = new Error('Supabase removed');");
    content = content.replace(/await\s+supabase[^;]+;/g, "/* Removed Supabase Call */");
    content = content.replace(/supabase\.from\([^;]+;/g, "/* Removed Supabase Call */");
    
    // Remove any stray "supabase" mentions in comments
    content = content.replace(/\/\/.*supabase.*/gi, '');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Cleaned ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            cleanFile(fullPath);
        }
    }
}

for (const d of directories) {
    walkDir(d);
}

console.log("Cleanup complete");
