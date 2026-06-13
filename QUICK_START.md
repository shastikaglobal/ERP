# Quick Start: Apply Client Acquisition Fix

## What's Fixed
✅ Frontend: Company filtering, error handling, better UI
✅ Database: Migration file created with proper RLS and seed data
✅ Dev server: Running on http://127.0.0.1:8080/ with hot reload

## What You Need To Do (2 Steps)

### Step 1: Apply the Database Migration

**Using Supabase Dashboard (Easiest):**

1. Go to https://app.supabase.com and open your project
2. Click **SQL Editor** → **New Query**
3. Copy this entire file:
   ```
   supabase/migrations/20260614000001_create_acquisition_channels.sql
   ```
4. Paste into the SQL Editor
5. Click **Run**

**Expected Output:**
```
Query executed successfully
```

---

### Step 2: Refresh and Test

1. Open http://127.0.0.1:8080/ in your browser (dev server already running)
2. Navigate to **CRM > Client Acquisition**
3. Open browser **Console** (F12) to see logs
4. Look for messages like:
   ```
   Fetched X leads for company...
   Channel Website / Online Inquiry: X leads, X clients
   ```

---

## Test with Sample Data (Optional)

To see the dashboard working, create test leads:

```sql
-- Paste this in Supabase SQL Editor

-- Get your company ID
SELECT id FROM public.companies LIMIT 1;

-- Create a test lead marked as "Client Successfully Acquired"
INSERT INTO public.leads (
  company_id,
  name,
  email,
  phone,
  stage,
  source_id,
  is_deleted
) VALUES (
  (SELECT id FROM public.companies LIMIT 1),
  'Test Client Name',
  'test@example.com',
  '+1234567890',
  'Client Successfully Acquired',
  (SELECT id FROM public.acquisition_channels LIMIT 1),
  false
);
```

Then refresh the Client Acquisition page - you should see data!

---

## What Each Fix Does

| Problem | Fix | Impact |
|---------|-----|--------|
| No data showing | Added `.eq('company_id', companyId)` filter | Now fetches leads for current user's company only |
| Silent failures | Added error handling + console logs | Users see helpful error messages, devs can debug |
| Missing table | Created migration with RLS policies | Database now has acquisition_channels table |
| Confusing UI | Improved empty state message | Users know what to do to get data |

---

## Files Changed

```
✅ src/pages/crm/ClientAcquisition.tsx
   - Fixed lead query with company filter
   - Added error handling
   - Better empty state UI
   - Console logging for debugging

✅ supabase/migrations/20260614000001_create_acquisition_channels.sql (NEW)
   - Creates acquisition_channels table
   - Adds source_id to leads table
   - Configures RLS policies
   - Seeds default channels

✅ scripts/apply_acquisition_migration.bat (NEW)
✅ scripts/apply_acquisition_migration.sh (NEW)
   - Helper scripts to run migration

✅ CLIENTACQUISITION_FIX.md (NEW)
   - Detailed documentation
```

---

## Still Having Issues?

Check the detailed guide: [CLIENTACQUISITION_FIX.md](CLIENTACQUISITION_FIX.md)

### Quick Diagnostics:

```sql
-- Check migration was applied
SELECT COUNT(*) FROM public.acquisition_channels;

-- Check leads exist
SELECT COUNT(*) FROM public.leads WHERE is_deleted = false;

-- Check leads with correct stage
SELECT COUNT(*) FROM public.leads 
WHERE stage IN ('Won', 'Client Successfully Acquired');

-- Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'acquisition_channels';
```

---

## Next Steps

After applying the migration:

1. ✅ Frontend is already updated (dev server running)
2. ⏳ Apply database migration (you do this)
3. ⏳ Test with sample data
4. 🚀 Create automatic workflow triggers (optional, for full integration)

The dashboard will show data immediately after step 2!

---

**Status:** Ready to deploy 🚀
