-- ============================================================
-- FINANCE TABLES: Invoices and Payments
-- ============================================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id TEXT, -- Assuming export orders are not fully modeled yet, using TEXT for now
  customer TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'Pending',
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invoices_company ON public.invoices(company_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT,
  status TEXT NOT NULL DEFAULT 'Completed',
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_company ON public.payments(company_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

-- Timestamp triggers
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "invoices_modify" ON public.invoices FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "payments_modify" ON public.payments FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
