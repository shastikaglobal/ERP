const fs = require('fs');

// Fix FarmVisits - double try/catch with CRLF/LF mix
let fv = fs.readFileSync('src/pages/farmers/FarmVisits.tsx', 'utf8');
const badBlock = `    try {\r\n      try {\r\n      await addVisit({\r\n        id: selectedRecord ? selectedRecord.id : \`v-\${Date.now()}\`,\r\n        farmer_id: formData.farmer_id || '',\r\n        date: formData.visit_date ? new Date(formData.visit_date).toISOString() : new Date().toISOString(),\r\n        status: formData.status || 'Scheduled',\r\n        notes: formData.notes || ''\r\n      });\r\n      toast.success("Visit scheduled");\r\n      setModalOpen(false);\r\n    } catch (err: any) {\r\n      toast.error(err.message || 'Failed to schedule visit');\r\n    }\r\n    } catch(err: any) {\r\n      toast.error(err.message || 'Failed to schedule visit');\r\n    }`;
const goodBlock = `    try {\r\n      await addVisit({\r\n        id: selectedRecord ? selectedRecord.id : \`v-\${Date.now()}\`,\r\n        farmer_id: formData.farmer_id || '',\r\n        date: formData.visit_date ? new Date(formData.visit_date).toISOString() : new Date().toISOString(),\r\n        status: formData.status || 'Scheduled',\r\n        notes: formData.notes || ''\r\n      });\r\n      toast.success("Visit scheduled");\r\n      setModalOpen(false);\r\n    } catch (err: any) {\r\n      toast.error(err.message || 'Failed to schedule visit');\r\n    }`;

if (fv.includes(badBlock)) {
  fv = fv.replace(badBlock, goodBlock);
  console.log('FarmVisits: double try/catch fixed');
} else {
  console.error('FarmVisits: pattern NOT FOUND');
  // debug: show around the try block
  const idx = fv.indexOf('try {\r\n      try {');
  if (idx !== -1) console.log('Found at idx', idx, JSON.stringify(fv.slice(idx, idx+100)));
}
fs.writeFileSync('src/pages/farmers/FarmVisits.tsx', fv, 'utf8');

// Fix SupplyCommitments - handleSave not async, wrong field mapping
let sc = fs.readFileSync('src/pages/farmers/SupplyCommitments.tsx', 'utf8');
const scBad = `  const handleSave = (e: React.FormEvent) => {\r\n    e.preventDefault();\r\n    if (!validateForm()) return;\r\n\r\n    addCommitment({\r\n      id: selectedRecord ? selectedRecord.id : \`scm-\${Date.now()}\`,\r\n      farmer_id: formData.farmer_id || '',\r\n      crop: formData.crop_name || '',\r\n      qty: Number(formData.committed_quantity),\r\n      status: formData.status || 'Pending'\r\n    });\r\n\r\n    if (formData.status === 'Completed' || formData.status === 'Partial') {\r\n      updateFarmerStatus(formData.farmer_id || '', 'Commitment Pending');\r\n    }\r\n\r\n    toast.success("Commitment saved");\r\n    setModalOpen(false);\r\n  };`;
const scGood = `  const handleSave = async (e: React.FormEvent) => {\r\n    e.preventDefault();\r\n    if (!validateForm()) return;\r\n\r\n    try {\r\n      await addCommitment({\r\n        id: selectedRecord ? selectedRecord.id : \`scm-\${Date.now()}\`,\r\n        farmer_id: formData.farmer_id || '',\r\n        crop: formData.crop_name || '',\r\n        status: formData.status || 'Pending',\r\n        quantity: Number(formData.committed_quantity),\r\n        delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : new Date().toISOString()\r\n      });\r\n      if (formData.status === 'Completed' || formData.status === 'Partial') {\r\n        updateFarmerStatus(formData.farmer_id || '', 'Commitment Pending');\r\n      }\r\n      toast.success("Commitment saved");\r\n      setModalOpen(false);\r\n    } catch (err) {\r\n      toast.error(err.message || 'Failed to save commitment');\r\n    }\r\n  };`;
if (sc.includes(scBad)) {
  sc = sc.replace(scBad, scGood);
  fs.writeFileSync('src/pages/farmers/SupplyCommitments.tsx', sc, 'utf8');
  console.log('SupplyCommitments: handleSave fixed');
} else {
  console.error('SupplyCommitments: pattern NOT FOUND');
  const idx = sc.indexOf('handleSave');
  console.log(JSON.stringify(sc.slice(idx, idx+400)));
}
