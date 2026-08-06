-- Add company_id to tables that are missing it
ALTER TABLE farmer_ratings ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE farmer_support ADD COLUMN IF NOT EXISTS company_id UUID;

-- Also add missing columns for payouts (actual schema uses payment_date, no reference_number)
-- payouts has: id, farmer_id, contract_id, collection_id, amount, payment_date, bank_account, ifsc, transaction_ref, status, notes
-- We need to allow inserts without contract_id/collection_id
ALTER TABLE payouts ALTER COLUMN contract_id DROP NOT NULL;
ALTER TABLE payouts ALTER COLUMN collection_id DROP NOT NULL;

-- Add missing columns to farmer_support to accept the issue field
ALTER TABLE farmer_support ADD COLUMN IF NOT EXISTS issue TEXT;
ALTER TABLE farmer_support ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Add score/review to farmer_ratings 
ALTER TABLE farmer_ratings ADD COLUMN IF NOT EXISTS score NUMERIC(3,1);
ALTER TABLE farmer_ratings ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE farmer_ratings ADD COLUMN IF NOT EXISTS created_by UUID;

-- Confirm
SELECT 'farmer_ratings' as tbl, column_name FROM information_schema.columns WHERE table_name='farmer_ratings'
UNION ALL SELECT 'payouts', column_name FROM information_schema.columns WHERE table_name='payouts'
UNION ALL SELECT 'farmer_support', column_name FROM information_schema.columns WHERE table_name='farmer_support'
ORDER BY 1, 2;
