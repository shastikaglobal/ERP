import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    SELECT 
      trigger_name, 
      event_object_table AS table_name, 
      action_statement AS action
    FROM 
      information_schema.triggers
    WHERE 
      event_object_table IN ('user_sessions', 'profiles', 'active_sessions', 'activity_logs');
  `;
  
  const { data, error } = await sb.rpc('execute_sql', { sql_query: query });
  console.log("Triggers:", data, "Error:", error);
}

run();
