const fs = require('fs');
const path = require('path');

const DIR = 'e:/SHASTI/backuperp/backuperp/src/pages/farmers';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Make handleSave async if it's not already
  if (content.includes('const handleSave = (e: React.FormEvent) => {')) {
    content = content.replace('const handleSave = (e: React.FormEvent) => {', 'const handleSave = async (e: React.FormEvent) => {');
    changed = true;
  } else if (content.includes('const handleSave = (e: any) => {')) {
    content = content.replace('const handleSave = (e: any) => {', 'const handleSave = async (e: any) => {');
    changed = true;
  }

  // Wrap the logic in try/catch and add await before add mutations
  // 1. Payouts
  if (file === 'FarmerPayouts.tsx') {
    content = content.replace(
      /addPayout\(\{[\s\S]*?\}\);[\s\S]*?toast\.success\("Payout scheduled"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addPayout({
        id: \`pay-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        amount: Number(formData.amount),
        status: formData.status || 'Pending',
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : new Date().toISOString(),
        reference: formData.reference || '',
        notes: formData.notes || ''
      });
      if (formData.status === 'Completed') {
        updateFarmerStatus(formData.farmer_id, 'Completed');
      }
      toast.success("Payout scheduled");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payout');
    }`
    );
    changed = true;
  }

  // 2. Ratings
  if (file === 'FarmerRating.tsx') {
    content = content.replace(
      /addRating\(\{[\s\S]*?toast\.success\("Rating saved"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addRating({
        id: selectedRecord ? selectedRecord.id : \`rtg-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        score: Number(formData.score) || 0,
        review: formData.review || ''
      });
      toast.success("Rating saved");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rating');
    }`
    );
    changed = true;
  }

  // 3. Support Tickets
  if (file === 'FarmerSupport.tsx') {
    content = content.replace(
      /addTicket\(\{[\s\S]*?toast\.success\("Ticket saved successfully"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addTicket({
        id: selectedRecord ? selectedRecord.id : \`tkt-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        issue: formData.issue || '',
        status: formData.status || 'Open',
        resolution: formData.resolution || ''
      });
      toast.success("Ticket saved successfully");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save ticket');
    }`
    );
    changed = true;
  }

  // 4. Goods Collection
  if (file === 'GoodsCollection.tsx') {
    content = content.replace(
      /await addCollection\(\{[\s\S]*?toast\.success\("Collection saved"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addCollection({
        id: selectedRecord ? selectedRecord.id : \`col-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        crop: formData.crop_name || '',
        status: formData.status || 'Pending',
        quantity: formData.collected_quantity || 0,
        collection_date: formData.collection_date ? new Date(formData.collection_date).toISOString() : new Date().toISOString(),
        quality_grade: formData.quality_grade || 'A',
        contract_id: formData.contract_id || null
      });
      if (formData.status === 'Received') {
        updateFarmerStatus(formData.farmer_id || '', 'Payout Pending');
      }
      toast.success("Collection saved");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save collection');
    }`
    );
    changed = true;
  }

  // 5. Supply Commitments
  if (file === 'SupplyCommitments.tsx') {
    content = content.replace(
      /await addCommitment\(\{[\s\S]*?toast\.success\("Commitment saved"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addCommitment({
        id: selectedRecord ? selectedRecord.id : \`c-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        crop: formData.crop_name || '',
        status: formData.status || 'Pending',
        quantity: formData.committed_quantity || 0,
        delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : new Date().toISOString()
      });
      toast.success("Commitment saved");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save commitment');
    }`
    );
    changed = true;
  }

  // 6. Farm Visits
  if (file === 'FarmVisits.tsx') {
    content = content.replace(
      /await addVisit\(\{[\s\S]*?toast\.success\("Visit scheduled"\);[\s\S]*?setModalOpen\(false\);/,
      `try {
      await addVisit({
        id: selectedRecord ? selectedRecord.id : \`v-\${Date.now()}\`,
        farmer_id: formData.farmer_id || '',
        date: formData.visit_date ? new Date(formData.visit_date).toISOString() : new Date().toISOString(),
        status: formData.status || 'Scheduled',
        notes: formData.notes || ''
      });
      toast.success("Visit scheduled");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule visit');
    }`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated handleSave in ${file}`);
  }
}
