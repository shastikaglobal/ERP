import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// We can't run raw SQL via the JS client without a custom RPC.
// Let's call the run-migration edge function instead — or use REST API to run the migration.
// Actually, we need to call the SQL via the management API or dashboard.
// Let me use the REST API (management API) approach with the service role key.

const migrationsql = `
DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'active_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
  END IF;
END $body$;
`;

// Call using the Supabase REST API for running SQL
const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
});
console.log("Status:", response.status, await response.text());
