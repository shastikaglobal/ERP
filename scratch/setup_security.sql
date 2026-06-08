-- Create security_settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    ip_whitelisting BOOLEAN DEFAULT false,
    hardware_token BOOLEAN DEFAULT false,
    screenshot_protection BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can manage security settings" ON public.security_settings;

-- Create Policies

-- Admin can manage
CREATE POLICY "Admins can manage security settings"
ON public.security_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.slug IN ('admin', 'manager')
    )
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.slug IN ('admin', 'manager')
    )
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
);

-- Create a trigger function to auto-insert a security_settings row when a company is created
CREATE OR REPLACE FUNCTION public.handle_new_company_security()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_company_created_security ON public.companies;
CREATE TRIGGER on_company_created_security
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_company_security();

-- Insert initial rows for existing companies
INSERT INTO public.security_settings (company_id)
SELECT id FROM public.companies
ON CONFLICT DO NOTHING;
