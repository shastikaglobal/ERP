import re
import os

files = [
    r'e:\SHASTI\backuperp\backuperp\src\pages\farmers\FarmerDetail.tsx',
    r'e:\SHASTI\backuperp\backuperp\src\pages\farmers\FarmerSupport.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace supabase.from(...) with fetch
    # This is a bit complex for a generic script, I'll just remove the whole supabase effect block if it exists and let it be handled by API if I have time, or I'll just write a specific replacement for those two files.
    
    # Actually, it's easier to just use standard fetch replacement for single-line supabase queries.
    content = re.sub(r'await supabase\.from\([^)]+\)\.select\([^)]+\)', "await fetch('/api/farmers', { credentials: 'include' }).then(r=>r.json())", content)
    
    # Let me just print out what's remaining.
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
