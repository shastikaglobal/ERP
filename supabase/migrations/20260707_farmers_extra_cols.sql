ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS farm_area NUMERIC;
