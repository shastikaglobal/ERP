-- Test Script: Verify Client Acquisition Setup
-- Run this in Supabase SQL Editor to verify the migration works

-- ================================================================
-- 1. VERIFY TABLE CREATION
-- ================================================================

-- Check if acquisition_channels table exists
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables
WHERE table_name = 'acquisition_channels' AND table_schema = 'public';

-- If you see a result, the table was created successfully!


-- ================================================================
-- 2. VERIFY COLUMNS
-- ================================================================

-- Check the columns in acquisition_channels
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'acquisition_channels'
ORDER BY ordinal_position;

-- Expected columns: id, company_id, channel_name, avg_lead_cost, created_at, updated_at


-- ================================================================
-- 3. VERIFY RLS POLICIES
-- ================================================================

-- Check that RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'acquisition_channels' AND schemaname = 'public';

-- Should show "True" for rowsecurity

-- Check that RLS policies were created
SELECT 
  policyname,
  tablename,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'acquisition_channels'
ORDER BY cmd;

-- Should show 4 policies: SELECT, INSERT, UPDATE, DELETE


-- ================================================================
-- 4. CHECK SOURCE_ID COLUMN IN LEADS
-- ================================================================

-- Verify that source_id was added to leads table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'leads' 
  AND column_name = 'source_id';

-- Should show source_id with data_type 'uuid' and is_nullable 'YES'


-- ================================================================
-- 5. VERIFY DEFAULT CHANNELS WERE SEEDED
-- ================================================================

-- Check that default channels exist
SELECT 
  id,
  channel_name,
  avg_lead_cost,
  created_at
FROM public.acquisition_channels
ORDER BY channel_name;

-- Should show 7 channels:
-- - Social Media (Instagram, Facebook)
-- - Trade Fair / Exhibition
-- - Referral
-- - Cold Call / Direct Outreach
-- - Website / Online Inquiry
-- - WhatsApp Marketing
-- - Agent / Broker


-- ================================================================
-- 6. CREATE TEST LEAD (optional - to verify dashboard works)
-- ================================================================

-- Get your company ID first
SELECT id, name FROM public.companies LIMIT 1;

-- Then create a test lead (replace COMPANY_ID and CHANNEL_ID):
-- INSERT INTO public.leads (
--   company_id,
--   name,
--   email,
--   phone,
--   stage,
--   source_id,
--   is_deleted
-- ) VALUES (
--   'YOUR_COMPANY_ID',
--   'Test Client - John Smith',
--   'john@example.com',
--   '+1-555-0123',
--   'Client Successfully Acquired',
--   'YOUR_CHANNEL_ID',
--   false
-- );

-- To get the channel ID:
SELECT id, channel_name FROM public.acquisition_channels LIMIT 1;


-- ================================================================
-- 7. VERIFY DATA APPEARS IN DASHBOARD (After above insert)
-- ================================================================

-- Count leads by channel
SELECT 
  ac.channel_name,
  COUNT(l.id) as lead_count,
  COUNT(CASE WHEN l.stage IN ('Won', 'Client Successfully Acquired') THEN 1 END) as converted_count
FROM public.acquisition_channels ac
LEFT JOIN public.leads l ON l.source_id = ac.id AND l.is_deleted = false
GROUP BY ac.channel_name
ORDER BY ac.channel_name;


-- ================================================================
-- SUCCESS CHECKLIST
-- ================================================================

-- After running all queries above, you should see:
-- ✅ acquisition_channels table exists
-- ✅ 6 columns (id, company_id, channel_name, avg_lead_cost, created_at, updated_at)
-- ✅ RLS is enabled (rowsecurity = True)
-- ✅ 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
-- ✅ source_id column exists in leads table
-- ✅ 7 default channels are seeded
-- ✅ Test data shows up in the channel summary (if you created a test lead)

-- If all checks pass, the migration was successful! 🎉
