ALTER TABLE farmers DROP CONSTRAINT IF EXISTS farmers_verification_status_check;
ALTER TABLE farmers ADD CONSTRAINT farmers_verification_status_check CHECK (verification_status IN ('Unverified', 'Pending', 'Verified', 'Rejected', 'Visit Scheduled', 'Farm Visit Scheduled', 'Approved'));
