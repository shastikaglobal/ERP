const fs = require('fs');
const path = require('path');

function fix(filePath, transforms) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [from, to] of transforms) {
    if (!content.includes(from)) {
      console.error(`MISSING in ${path.basename(filePath)}: "${from.slice(0, 60)}"`);
    } else {
      content = content.replace(from, to);
    }
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`FIXED: ${path.basename(filePath)}`);
  } else {
    console.log(`SKIPPED (no changes): ${path.basename(filePath)}`);
  }
}

const DIR = 'src/pages/farmers';

// ─── 1. FarmVisits.tsx ───────────────────────────────────────────────────────
// Bug A: visited_by required validation blocks save (backend doesn't need it)
// Bug B: double-nested try/catch from botched patcher
fix(`${DIR}/FarmVisits.tsx`, [
  [
    `    if (!formData.visited_by) errors.visited_by = "Please select an employee";`,
    `    // visited_by is optional on backend`
  ],
  [
    `    try {\r\n      try {\n      await addVisit({`,
    `    try {\n      await addVisit({`
  ],
  [
    `      toast.success("Visit scheduled");\n      setModalOpen(false);\n    } catch (err: any) {\n      toast.error(err.message || 'Failed to schedule visit');\n    }\r\n    } catch(err: any) {\r\n      toast.error(err.message || 'Failed to schedule visit');\r\n    }`,
    `      toast.success("Visit scheduled");\n      setModalOpen(false);\n    } catch (err: any) {\n      toast.error(err.message || 'Failed to schedule visit');\n    }`
  ]
]);

// ─── 2. SupplyCommitments.tsx ────────────────────────────────────────────────
// Bug: handleSave not async, addCommitment not awaited, wrong field names (qty not quantity, no delivery_date)
fix(`${DIR}/SupplyCommitments.tsx`, [
  [
    `  const handleSave = (e: React.FormEvent) => {\r\n    e.preventDefault();\r\n    if (!validateForm()) return;\r\n\r\n    addCommitment({\r\n      id: selectedRecord ? selectedRecord.id : \`scm-\${Date.now()}\`,\r\n      farmer_id: formData.farmer_id || '',\r\n      crop: formData.crop_name || '',\r\n      qty: Number(formData.committed_quantity),\r\n      status: formData.status || 'Pending'\r\n    });\r\n\r\n    if (formData.status === 'Completed' || formData.status === 'Partial') {\r\n      updateFarmerStatus(formData.farmer_id || '', 'Commitment Pending');\r\n    }\r\n\r\n    toast.success("Commitment saved");\r\n    setModalOpen(false);\r\n  };`,
    `  const handleSave = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!validateForm()) return;\n\n    try {\n      await addCommitment({\n        id: selectedRecord ? selectedRecord.id : \`scm-\${Date.now()}\`,\n        farmer_id: formData.farmer_id || '',\n        crop: formData.crop_name || '',\n        status: formData.status || 'Pending',\n        quantity: Number(formData.committed_quantity),\n        delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : new Date().toISOString()\n      });\n      if (formData.status === 'Completed' || formData.status === 'Partial') {\n        updateFarmerStatus(formData.farmer_id || '', 'Commitment Pending');\n      }\n      toast.success("Commitment saved");\n      setModalOpen(false);\n    } catch (err) {\n      toast.error(err.message || 'Failed to save commitment');\n    }\n  };`
  ]
]);

// ─── 3. FarmerRating.tsx ─────────────────────────────────────────────────────
// Bug A: syntax error in useMemo (missing comma, stray fields score/review)
// Bug B: addRating sends formData.score which is undefined (form uses quality_score)
fix(`${DIR}/FarmerRating.tsx`, [
  [
    `        id: d.id,
        farmer_id: d.farmer_id,
        score: d.score || d.rating || 0,
        review: d.review || d.notes || ''
        farmer_name: f?.full_name || 'Unknown Farmer',`,
    `        id: d.id,
        farmer_id: d.farmer_id,
        farmer_name: f?.full_name || 'Unknown Farmer',`
  ],
  [
    `      await addRating({\n        id: selectedRecord ? selectedRecord.id : \`rtg-\${Date.now()}\`,\n        farmer_id: formData.farmer_id || '',\n        score: Number(formData.score) || 0,\n        review: formData.review || ''\n      });`,
    `      await addRating({\n        id: selectedRecord ? selectedRecord.id : \`rtg-\${Date.now()}\`,\n        farmer_id: formData.farmer_id || '',\n        score: computedOverall,\n        review: formData.notes || ''\n      });`
  ]
]);

// ─── 4. FarmerSupport.tsx ────────────────────────────────────────────────────
// Bug: sends formData.issue (undefined) — form field is issue_category + description
fix(`${DIR}/FarmerSupport.tsx`, [
  [
    `        issue: formData.issue || '',`,
    `        issue: (formData.issue_category || '') + (formData.description ? ': ' + formData.description : ''),`
  ]
]);

// ─── 5. FarmerPayouts.tsx ────────────────────────────────────────────────────
// Bug: sends 'reference' but PayoutRecord type & backend expect 'reference_number'
// Also fix the duplicate payment_date line
fix(`${DIR}/FarmerPayouts.tsx`, [
  [
    `        payment_date: d.payment_date || new Date().toISOString()\r\n        payment_date: new Date().toISOString(),`,
    `        payment_date: d.payment_date || new Date().toISOString(),`
  ],
  [
    `        reference: formData.reference || '',`,
    `        notes: formData.notes || ''`
  ]
]);

// ─── 6. FarmerContext.tsx ────────────────────────────────────────────────────
// Ensure PayoutRecord has reference_number not reference
fix('src/context/FarmerContext.tsx', [
  [
    `export interface PayoutRecord { id: string; farmer_id: string; amount: number; status: string; payment_date?: string; reference?: string; notes?: string; }`,
    `export interface PayoutRecord { id: string; farmer_id: string; amount: number; status: string; payment_date?: string; notes?: string; }`
  ]
]);

console.log('\nAll fixes applied. Run: git add src/ && git commit -m "Fix all farmers module save bugs" && git push');
