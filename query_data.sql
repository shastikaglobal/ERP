SELECT id, farmer_id, company_id, crop, quantity, delivery_date FROM commitments ORDER BY created_at DESC LIMIT 5;
SELECT id, farmer_id, company_id, crop, quantity_collected, collection_date FROM collections ORDER BY created_at DESC LIMIT 5;
