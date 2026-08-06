const fs = require('fs');

// Fix SupplyCommitments: replace addCommitment call with correct field names
let c = fs.readFileSync('src/pages/farmers/SupplyCommitments.tsx', 'utf8');

// Find and replace the handleSave body
const idx = c.indexOf('handleSave');
const before = c.slice(idx, idx + 600);
console.log('Current handleSave area:\n', before);

// Replace qty -> quantity and add delivery_date, wrap in try/catch
c = c.replace(
  /addCommitment\(\{\s*id: selectedRecord[^}]+\}\);/s,
  `try {
      await addCommitment({
        id: selectedRecord ? selectedRecord.id : \`scm-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        crop: formData.crop_name || '',
        status: formData.status || 'Pending',
        quantity: Number(formData.committed_quantity),
        delivery_date: formData.expected_delivery_date
          ? new Date(formData.expected_delivery_date).toISOString()
          : new Date().toISOString()
      });`
);

// Now also wrap the status update + toast + modal close in try/catch if not already
if (!c.includes("} catch(err)") && !c.includes("} catch (err)")) {
  c = c.replace(
    /toast\.success\("Commitment saved"\);\r?\n\s*setModalOpen\(false\);/,
    `toast.success("Commitment saved");
      setModalOpen(false);
    } catch(err) {
      toast.error(err.message || 'Failed to save commitment');
    }`
  );
}

fs.writeFileSync('src/pages/farmers/SupplyCommitments.tsx', c, 'utf8');
console.log('\nFixed SupplyCommitments');
