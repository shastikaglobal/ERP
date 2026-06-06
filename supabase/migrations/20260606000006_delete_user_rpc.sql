CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the caller is an admin
  IF NOT public.is_company_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
  END IF;

  -- Delete from auth.users
  -- (Because of the cascade foreign keys, this will also delete their profile and everything else linked to them)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
