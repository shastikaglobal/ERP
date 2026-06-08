-- Fix: Statement-level triggers in PL/pgSQL must return NULL, not NEW.
-- Returning NEW causes "record \"new\" is not assigned yet" error which blocks all inserts.
CREATE OR REPLACE FUNCTION public.prune_old_team_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete messages older than 24 hours
  DELETE FROM public.team_chat
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
