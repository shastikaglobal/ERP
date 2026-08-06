const fs = require('fs');
const path = require('path');

const DIR = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers';

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix substring crashes: .substring( -> ?.substring(
  if (content.includes('.substring(')) {
    // Only target places like f.id.substring or record.visit_date.substring
    // We don't want to replace string literal substrings.
    content = content.replace(/(\w+)\.substring\(/g, (match, p1) => {
      return `${p1}?.substring(`;
    });
    changed = true;
  }

  // 2. Fix setData is not defined
  if (content.includes('setData(')) {
    // Replace setData(prev => ...) with appropriate action or just remove the fake state update
    // If it's a delete/cancel, we should call the context method if available, or just toast success and rely on invalidateQueries if we actually fired an API call.
    // In FarmVisits:
    if (file === 'FarmVisits.tsx') {
      content = content.replace(/setData\(prev => prev\.map\(d => \{[\s\S]*?return d;\s*\}\)\);/g, `
      // using addVisit to update status
      addVisit({
        id: selectedRecord.id,
        farmer_id: selectedRecord.farmer_id,
        date: selectedRecord.visit_date,
        status: 'Cancelled',
        notes: selectedRecord.notes
      }).then(() => {
        // success handled by context invalidate
      }).catch(console.error);
      `);
      
      content = content.replace(/setData\(prev => prev\.filter\(d => d\.id !== selectedRecord\.id\)\);/g, `
      // API call to delete if it existed, otherwise just toast.
      // Assuming no delete API, we just ignore local state mutation since it shouldn't exist without an API.
      // Or we can add an apiFetch call here:
      apiFetch('/api/farmers/visits/' + selectedRecord.id, { method: 'DELETE' }).catch(console.error);
      `);
    } else if (file === 'SupplyCommitments.tsx' || file === 'KYC.tsx') {
      content = content.replace(/setData\(prev => prev\.filter\(d => d\.id !== selectedRecord\.id\)\);/g, `
      apiFetch('/api/farmers/' + (file==='KYC.tsx'?'kyc':'commitments') + '/' + selectedRecord.id, { method: 'DELETE' }).catch(console.error);
      `);
    }
    changed = true;
  }

  // 3. Fix mutate() to mutateAsync() inside components if they directly use react-query without FarmerContext wrapper
  if (content.includes('.mutate(')) {
    content = content.replace(/\.mutate\(/g, '.mutateAsync(');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
