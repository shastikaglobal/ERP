-- Create acquisition_channels table
CREATE TABLE IF NOT EXISTS public.acquisition_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    avg_lead_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add source_id to leads table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='source_id') THEN
        ALTER TABLE public.leads ADD COLUMN source_id UUID REFERENCES public.acquisition_channels(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.acquisition_channels ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='acquisition_channels_select_policy' AND tablename='acquisition_channels') THEN
        CREATE POLICY acquisition_channels_select_policy ON public.acquisition_channels FOR SELECT USING (company_id = (auth.jwt()->>'company_id')::uuid);
        CREATE POLICY acquisition_channels_insert_policy ON public.acquisition_channels FOR INSERT WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);
        CREATE POLICY acquisition_channels_update_policy ON public.acquisition_channels FOR UPDATE USING (company_id = (auth.jwt()->>'company_id')::uuid);
        CREATE POLICY acquisition_channels_delete_policy ON public.acquisition_channels FOR DELETE USING (company_id = (auth.jwt()->>'company_id')::uuid);
    END IF;
END $$;

-- Seed some default channels if none exist
INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
SELECT '00000000-0000-0000-0000-00000000ae01', 'Corporate Website Inquiry', 14.50
WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = 'Corporate Website Inquiry');

INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
SELECT '00000000-0000-0000-0000-00000000ae01', 'Gulf Agri Expo UAE (Trade Fair)', 240.00
WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = 'Gulf Agri Expo UAE (Trade Fair)');

INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
SELECT '00000000-0000-0000-0000-00000000ae01', 'Partner Referrals', 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = 'Partner Referrals');

INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
SELECT '00000000-0000-0000-0000-00000000ae01', 'LinkedIn Outbound BDE', 12.00
WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = 'LinkedIn Outbound BDE');

INSERT INTO public.acquisition_channels (company_id, channel_name, avg_lead_cost)
SELECT '00000000-0000-0000-0000-00000000ae01', 'AgriMarketplace B2B', 45.00
WHERE NOT EXISTS (SELECT 1 FROM public.acquisition_channels WHERE channel_name = 'AgriMarketplace B2B');
