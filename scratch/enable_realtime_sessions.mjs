import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_REF = "sxebygxpjzntogzpjnga";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'active_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
    RAISE NOTICE 'active_sessions added to supabase_realtime publication.';
  ELSE
    RAISE NOTICE 'active_sessions was already in the realtime publication.';
  END IF;
END $$;
`;

// Use the Supabase Management API to run SQL
const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  }
);

const text = await response.text();
console.log("Status:", response.status);
console.log("Response:", text);
