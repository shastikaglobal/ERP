-- Migration: Website Audit Fixes
-- Created: 2026-06-25
-- Resolves Supabase-specific missing tables, missing columns, and security (RLS) policies.

-- ============================================================
-- 1. SECTION 3: Create public.warehouse_stock Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Policy for Authenticated Users
DROP POLICY IF EXISTS "Allow authenticated manage" ON public.warehouse_stock;
CREATE POLICY "Allow authenticated manage" ON public.warehouse_stock 
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 2. SECTION 4: Add Missing Columns
-- ============================================================

-- Add details column to public.audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- Add missing columns to public.attendance_logs
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS late_by_mins INTEGER DEFAULT 0;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS salary_cut NUMERIC(10,2) DEFAULT 0.00;


-- ============================================================
-- 3. SECTION 5: RLS & Security Policy Bindings
-- ============================================================

-- A. Email Integration logs & attachments policies (Enable RLS + Select/Insert policies)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read email_logs" ON public.email_logs;
CREATE POLICY "Allow authenticated read email_logs" ON public.email_logs 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert email_logs" ON public.email_logs;
CREATE POLICY "Allow authenticated insert email_logs" ON public.email_logs 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read email_attachments" ON public.email_attachments;
CREATE POLICY "Allow authenticated read email_attachments" ON public.email_attachments 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert email_attachments" ON public.email_attachments;
CREATE POLICY "Allow policy to insert email_attachments" ON public.email_attachments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- B. Team Chat table policies
ALTER TABLE public.team_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read chat" ON public.team_chat;
CREATE POLICY "Allow authenticated read chat" ON public.team_chat 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert chat" ON public.team_chat;
CREATE POLICY "Allow authenticated insert chat" ON public.team_chat 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- C. Suppliers table policies (Tenant Isolation using company_id)
-- Add missing company_id to public.suppliers if it does not exist
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Backfill company_id for existing suppliers to primary company
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM public.companies LIMIT 1;
  IF v_company_id IS NOT NULL THEN
    UPDATE public.suppliers SET company_id = v_company_id WHERE company_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_access_suppliers" ON public.suppliers;
CREATE POLICY "company_access_suppliers" ON public.suppliers 
  FOR ALL USING (company_id = public.get_my_company());


-- D. Activities table policies (Tenant Isolation using company_id)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_access_activities" ON public.activities;
CREATE POLICY "company_access_activities" ON public.activities 
  FOR ALL USING (company_id = public.get_my_company());


-- E. User Preferences table policies (User-level Isolation)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_access_user_preferences" ON public.user_preferences;
CREATE POLICY "company_access_user_preferences" ON public.user_preferences 
  FOR ALL USING (user_id = auth.uid());


-- F. Recreate Overdue Payments View with Security Invoker
-- This ensures queries on the view respect row-level security policies defined on the underlying public.payments table.
DROP VIEW IF EXISTS public.overdue_payments;
CREATE OR REPLACE VIEW public.overdue_payments WITH (security_invoker=on) AS
 SELECT id,
    company_id,
    invoice_id,
    customer,
    amount,
    currency,
    method,
    status,
    received_at,
    created_at,
    updated_at
   FROM public.payments
  WHERE ((status = 'Overdue'::text) OR ((status = 'Pending'::text) AND (received_at < CURRENT_DATE)));

-- Force schema reload to update PostgREST schema cache
NOTIFY pgrst, 'reload schema';
