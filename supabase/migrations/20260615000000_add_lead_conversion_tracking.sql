-- Add conversion tracking to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Add index for workflow performance
CREATE INDEX IF NOT EXISTS idx_leads_converted_at ON public.leads(converted_at);

-- Update RLS schema cache
NOTIFY pgrst, 'reload schema';
