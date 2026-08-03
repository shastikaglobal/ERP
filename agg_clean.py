import os
import re

directories = [
    r'e:\SHASTI\backuperp\backuperp\src\pages\quotations',
    r'e:\SHASTI\backuperp\backuperp\src\pages\shipments',
    r'e:\SHASTI\backuperp\backuperp\src\pages\crm',
    r'e:\SHASTI\backuperp\backuperp\src\pages\procurement',
    r'e:\SHASTI\backuperp\backuperp\src\pages\farmers'
]

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    content = re.sub(r'const\s+\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+supabase[^;]+;', "const data = null; const error = new Error('Supabase removed');", content)
    content = re.sub(r'const\s+\{\s*data\s*:\s*[a-zA-Z0-9_]+\s*,\s*error\s*:\s*[a-zA-Z0-9_]+\s*\}\s*=\s*await\s+supabase[^;]+;', "const error = new Error('Supabase removed');", content)
    content = re.sub(r'const\s+\{\s*data[^}]*\}\s*=\s*await\s+supabase[^;]+;', "const data = null; /* Removed Supabase */", content)
    content = re.sub(r'const\s+\{\s*error[^}]*\}\s*=\s*await\s+supabase[^;]+;', "const error = new Error('Supabase removed');", content)
    content = re.sub(r'await\s+supabase[^;]+;', "/* Removed Supabase Call */", content)
    content = re.sub(r'supabase\.from\([^;]+;', "/* Removed Supabase Call */", content)
    
    # Remove any stray "supabase" mentions in comments
    content = re.sub(r'//.*supabase.*', '', content, flags=re.IGNORECASE)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                clean_file(os.path.join(root, file))

print("Cleanup complete")
