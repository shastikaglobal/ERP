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
