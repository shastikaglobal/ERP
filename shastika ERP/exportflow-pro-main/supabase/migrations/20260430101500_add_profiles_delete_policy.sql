-- ADD DELETE POLICY FOR PROFILES
-- Allows users with 'hr.manage' or 'employees.manage' permission to delete profiles in their company.
-- Note: 'hr.manage' is the standard permission for HR, but we also allow 'employees.manage' for consistency with other employee tables.

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE USING (
    company_id = public.current_company_id()
    AND (
      public.has_permission(auth.uid(), 'hr.manage') 
      OR public.has_permission(auth.uid(), 'employees.manage')
      OR public.is_company_admin(auth.uid())
    )
  );
