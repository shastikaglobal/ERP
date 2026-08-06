const fs = require('fs');
const path = require('path');

const contextPath = 'e:/SHASTI/backuperp/backuperp/src/context/FarmerContext.tsx';
let contextStr = fs.readFileSync(contextPath, 'utf8');

// Update CommitmentRecord
contextStr = contextStr.replace(
  /export interface CommitmentRecord \{ id: string; farmer_id: string; crop: string; status: string; \}/,
  'export interface CommitmentRecord { id: string; farmer_id: string; crop: string; status: string; quantity?: number; delivery_date?: string; price_per_unit?: number; }'
);
// Update CollectionRecord
contextStr = contextStr.replace(
  /export interface CollectionRecord \{ id: string; farmer_id: string; crop: string; status: string; \}/,
  'export interface CollectionRecord { id: string; farmer_id: string; crop: string; status: string; quantity?: number; collection_date?: string; quality_grade?: string; contract_id?: string; }'
);
// Update PayoutRecord
contextStr = contextStr.replace(
  /export interface PayoutRecord \{ id: string; farmer_id: string; amount: number; status: string; \}/,
  'export interface PayoutRecord { id: string; farmer_id: string; amount: number; status: string; payment_date?: string; reference?: string; notes?: string; }'
);

fs.writeFileSync(contextPath, contextStr, 'utf8');

// 2. Supply Commitments
const scPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/SupplyCommitments.tsx';
let scStr = fs.readFileSync(scPath, 'utf8');
scStr = scStr.replace(/committed_quantity: d\.qty,/g, 'committed_quantity: d.quantity || d.qty || 0,');
scStr = scStr.replace(/delivered_quantity: d\.status === 'Completed' \? d\.qty : 0,/g, 'delivered_quantity: d.status === \'Completed\' ? (d.quantity || d.qty || 0) : 0,');
scStr = scStr.replace(
  /await addCommitment\(\{\s+id: selectedRecord \? selectedRecord\.id : `c-\$\{Date\.now\(\)\}`,\s+farmer_id: formData\.farmer_id \|\| '',\s+crop: formData\.crop_name \|\| '',\s+status: formData\.status \|\| 'Pending',\s+\}\);/,
  `await addCommitment({
        id: selectedRecord ? selectedRecord.id : \`c-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        crop: formData.crop_name || '',
        status: formData.status || 'Pending',
        quantity: formData.committed_quantity || 0,
        delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : new Date().toISOString()
      });`
);
fs.writeFileSync(scPath, scStr, 'utf8');

// 3. Goods Collection
const gcPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/GoodsCollection.tsx';
let gcStr = fs.readFileSync(gcPath, 'utf8');
gcStr = gcStr.replace(/collected_quantity: d\.qty,/g, 'collected_quantity: d.quantity || d.qty || 0,');
gcStr = gcStr.replace(
  /await addCollection\(\{\s+id: selectedRecord \? selectedRecord\.id : `col-\$\{Date\.now\(\)\}`,\s+farmer_id: formData\.farmer_id \|\| '',\s+crop: formData\.crop_name \|\| '',\s+status: formData\.status \|\| 'Pending',\s+\}\);/,
  `await addCollection({
        id: selectedRecord ? selectedRecord.id : \`col-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        crop: formData.crop_name || '',
        status: formData.status || 'Pending',
        quantity: formData.collected_quantity || 0,
        collection_date: formData.collection_date ? new Date(formData.collection_date).toISOString() : new Date().toISOString(),
        quality_grade: formData.quality_grade || 'A',
        contract_id: formData.contract_id || null
      });`
);
fs.writeFileSync(gcPath, gcStr, 'utf8');

// 4. Farmer Rating
const rPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/FarmerRating.tsx';
let rStr = fs.readFileSync(rPath, 'utf8');
rStr = rStr.replace(/farmer_id: d\.farmer_id,/g, 'farmer_id: d.farmer_id,\n        score: d.score || d.rating || 0,\n        review: d.review || d.notes || \'\'');
fs.writeFileSync(rPath, rStr, 'utf8');

// 5. Payouts
const pPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/FarmerPayouts.tsx';
let pStr = fs.readFileSync(pPath, 'utf8');
pStr = pStr.replace(/amount: d\.amount,/g, 'amount: d.amount || 0,\n        payment_date: d.payment_date || new Date().toISOString()');
pStr = pStr.replace(
  /await addPayout\(\{\s+id: selectedRecord \? selectedRecord\.id : `pay-\$\{Date\.now\(\)\}`,\s+farmer_id: formData\.farmer_id \|\| '',\s+amount: formData\.amount \|\| 0,\s+status: formData\.status \|\| 'Pending',\s+\}\);/,
  `await addPayout({
        id: selectedRecord ? selectedRecord.id : \`pay-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        amount: formData.amount || 0,
        status: formData.status || 'Pending',
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : new Date().toISOString(),
        reference: formData.reference || '',
        notes: formData.notes || ''
      });`
);
fs.writeFileSync(pPath, pStr, 'utf8');

// 6. Support Tickets
const tPath = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers/FarmerSupport.tsx';
let tStr = fs.readFileSync(tPath, 'utf8');
tStr = tStr.replace(/issue: d\.issue,/g, 'issue: d.issue || d.title || \'\'');
fs.writeFileSync(tPath, tStr, 'utf8');

console.log('Fixed schemas and state maps!');
