-- Check actual columns in each broken table
SELECT column_name FROM information_schema.columns WHERE table_name='farmer_ratings' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name='payouts' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name='farmer_support' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name='commitments' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name='collections' ORDER BY ordinal_position;
