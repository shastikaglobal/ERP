const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

let files = walk('src');

for(let f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Check for useCan
    if (content.includes('useCan(') || content.includes('useCan =')) {
        if (!content.includes('useCan } from') && !content.includes('useCan,') && !content.includes(', useCan')) {
            if (content.includes('import { useAuth } from "@/hooks/useAuth"')) {
                content = content.replace('import { useAuth } from "@/hooks/useAuth"', 'import { useAuth, useCan } from "@/hooks/useAuth"');
            } else if (content.includes("import { useAuth } from '@/hooks/useAuth'")) {
                content = content.replace("import { useAuth } from '@/hooks/useAuth'", "import { useAuth, useCan } from '@/hooks/useAuth'");
            } else {
                content = 'import { useCan } from "@/hooks/useAuth";\n' + content;
            }
            changed = true;
        }
    }

    // Check for useIsAdminOrManager
    if (content.includes('useIsAdminOrManager()')) {
        if (!content.includes('useIsAdminOrManager }') && !content.includes('useIsAdminOrManager,')) {
            if (content.includes('import { useAuth } from "@/hooks/useAuth"')) {
                content = content.replace('import { useAuth } from "@/hooks/useAuth"', 'import { useAuth, useIsAdminOrManager } from "@/hooks/useAuth"');
            } else if (content.includes("import { useAuth } from '@/hooks/useAuth'")) {
                content = content.replace("import { useAuth } from '@/hooks/useAuth'", "import { useAuth, useIsAdminOrManager } from '@/hooks/useAuth'");
            } else if (content.includes('import { useAuth, useCan } from "@/hooks/useAuth"')) {
                content = content.replace('import { useAuth, useCan } from "@/hooks/useAuth"', 'import { useAuth, useCan, useIsAdminOrManager } from "@/hooks/useAuth"');
            } else {
                content = 'import { useIsAdminOrManager } from "@/hooks/useAuth";\n' + content;
            }
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed missing hook imports in: ' + f);
    }
}
