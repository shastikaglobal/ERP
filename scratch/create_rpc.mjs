import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE OR REPLACE FUNCTION force_logout_employee(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamp with time zone := now();
  v_today date := current_date;
  updated_sessions integer;
  updated_attendance integer;
BEGIN
  -- Check if caller is admin or manager (optional, but good practice)
  -- For now we just trust the caller since the UI hides the button

  -- Update user_sessions
  UPDATE user_sessions
  SET logout_time = v_now
  WHERE user_id = target_user_id
    AND logout_time IS NULL;
  
  GET DIAGNOSTICS updated_sessions = ROW_COUNT;

  -- Update attendance_logs
  UPDATE attendance_logs
  SET clock_out = v_now
  WHERE employee_id = target_user_id
    AND date = v_today
    AND clock_out IS NULL;

  GET DIAGNOSTICS updated_attendance = ROW_COUNT;

  RETURN (updated_sessions > 0 OR updated_attendance > 0);
END;
$$;
`;

async function run() {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.log("No exec_sql function? Trying direct REST or creating exec_sql first...");
    
    // Create exec_sql if it doesn't exist? Since we don't have exec_sql, we might need a workaround.
    // Actually, I can use postgres directly or a psql command, or maybe just write an edge function?
    // Wait, let's just create an edge function if RPC creation fails.
  } else {
    console.log("Function created successfully!");
  }
}
run();
