-- Create acquisition_channels table for Client Acquisition dashboard
CREATE TABLE IF NOT EXISTS public.acquisition_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    avg_lead_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_acquisition_channels_company_id ON public.acquisition_channels(company_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_channels_channel_name ON public.acquisition_channels(channel_name);

-- Add source_id foreign key to leads table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='leads' AND column_name='source_id') THEN
        ALTER TABLE public.leads ADD COLUMN source_id UUID REFERENCES public.acquisition_channels(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.acquisition_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using consistent current_company_id() function
DROP POLICY IF EXISTS "acquisition_channels_select" ON public.acquisition_channels;
DROP POLICY IF EXISTS "acquisition_channels_insert" ON public.acquisition_channels;
DROP POLICY IF EXISTS "acquisition_channels_update" ON public.acquisition_channels;
DROP POLICY IF EXISTS "acquisition_channels_delete" ON public.acquisition_channels;

CREATE POLICY "acquisition_channels_select" ON public.acquisition_channels
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "acquisition_channels_insert" ON public.acquisition_channels
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "acquisition_channels_update" ON public.acquisition_channels
  FOR UPDATE USING (company_id = public.current_company_id());

CREATE POLICY "acquisition_channels_delete" ON public.acquisition_channels
  FOR DELETE USING (company_id = public.current_company_id());

-- Seed default acquisition channels for demo company
DO $$
DECLARE
    _company_id UUID;
BEGIN
    -- Get the first company (usually the demo company)
    SELECT id INTO _company_id FROM public.companies LIMIT 1;
    
    IF _company_id IS NOT NULL THEN
        INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
        VALUES 
            (_company_id, 'Social Media (Instagram, Facebook)', 5.00),
            (_company_id, 'Trade Fair / Exhibition', 250.00),
            (_company_id, 'Referral', 0.00),
            (_company_id, 'Cold Call / Direct Outreach', 12.00),
            (_company_id, 'Website / Online Inquiry', 3.50),
            (_company_id, 'WhatsApp Marketing', 2.00),
            (_company_id, 'Agent / Broker', 15.00)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
