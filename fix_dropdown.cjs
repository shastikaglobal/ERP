const fs = require('fs');
const path = require('path');

const gcPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/GoodsCollection.tsx';
let gcStr = fs.readFileSync(gcPath, 'utf8');

// 1. Add contracts to context
gcStr = gcStr.replace(
  'const { farmers, collections, addCollection, updateFarmerStatus } = useFarmerContext();',
  'const { farmers, collections, contracts, addCollection, updateFarmerStatus } = useFarmerContext();'
);

// 2. Add validContracts useMemo
gcStr = gcStr.replace(
  'const loading = false;',
  `const loading = false;
  
  const validContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'Active' || c.status === 'Completed');
  }, [contracts]);`
);

// 3. Populate dropdown
gcStr = gcStr.replace(
  '{/* Placeholder for contracts */}',
  `{validContracts
      .filter(c => c.farmer_id === formData.farmer_id)
      .map(c => (
        <option key={c.id} value={c.id}>{c.crop} ({c.status})</option>
      ))}`
);

fs.writeFileSync(gcPath, gcStr, 'utf8');
console.log('Fixed GoodsCollection dropdown!');
