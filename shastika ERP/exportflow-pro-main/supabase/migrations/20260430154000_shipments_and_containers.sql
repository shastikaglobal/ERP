-- ============================================================
-- SHIPMENTS & CONTAINERS
-- ============================================================

-- Shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,
  customer_name TEXT,
  origin TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  carrier TEXT,
  eta DATE,
  departed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, shipment_number)
);

-- Containers table
CREATE TABLE IF NOT EXISTS public.shipment_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  container_number TEXT NOT NULL,
  type TEXT,
  weight NUMERIC(10,2),
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, container_number)
);

-- RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_containers ENABLE ROW LEVEL SECURITY;

-- Policies for Shipments
CREATE POLICY shipments_select ON public.shipments 
  FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY shipments_insert ON public.shipments 
  FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY shipments_update ON public.shipments 
  FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY shipments_delete ON public.shipments 
  FOR DELETE USING (company_id = public.current_company_id());

-- Policies for Containers
CREATE POLICY containers_select ON public.shipment_containers 
  FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY containers_insert ON public.shipment_containers 
  FOR INSERT WITH CHECK (company_id = public.current_company_id());
CREATE POLICY containers_update ON public.shipment_containers 
  FOR UPDATE USING (company_id = public.current_company_id());
CREATE POLICY containers_delete ON public.shipment_containers 
  FOR DELETE USING (company_id = public.current_company_id());

-- Triggers for updated_at
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_containers_updated BEFORE UPDATE ON public.shipment_containers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some initial data if empty (Optional but helpful for testing)
INSERT INTO public.shipments (shipment_number, customer_name, origin, destination, status, carrier, eta, departed_at, company_id)
SELECT 'SH-2025-0045', 'Osaka Electronics', 'Mumbai, IN', 'Osaka, JP', 'In Transit', 'Maersk', '2025-05-18', '2025-04-14', id FROM public.companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.shipment_containers (container_number, shipment_id, type, weight, location, status, company_id)
SELECT 'SH-2025-0045-C1', s.id, '40ft HC', 22.0, 'At sea', 'In Transit', s.company_id FROM public.shipments s WHERE s.shipment_number = 'SH-2025-0045'
ON CONFLICT DO NOTHING;
