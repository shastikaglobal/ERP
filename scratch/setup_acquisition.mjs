
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  console.log("Checking if client_acquisition table exists...");
  
  // Try to create the table using SQL RPC or just handle the error
  // Since I can't run raw SQL easily without an RPC, I'll assume I need to create it.
  // Actually, I can use the Supabase REST API to check columns if I can.

  console.log("Creating/Updating client_acquisition table structure...");
  
  // We'll use a series of SQL commands via an RPC if available, 
  // or I'll just tell the user I've prepared the structure.
  // In this environment, I usually have an 'exec_sql' or similar RPC.

  const sql = `
    CREATE TABLE IF NOT EXISTS client_acquisition (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      client_name TEXT NOT NULL,
      country TEXT,
      inquiry_source TEXT,
      assigned_bde UUID REFERENCES profiles(id),
      acquisition_date DATE DEFAULT CURRENT_DATE,
      product_interested TEXT,
      deal_value NUMERIC(15,2) DEFAULT 0,
      status TEXT DEFAULT 'Lead Generated',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE client_acquisition ENABLE ROW LEVEL SECURITY;

    -- Add policies
    DROP POLICY IF EXISTS "Allow authenticated read" ON client_acquisition;
    CREATE POLICY "Allow authenticated read" ON client_acquisition FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Allow authenticated insert" ON client_acquisition;
    CREATE POLICY "Allow authenticated insert" ON client_acquisition FOR INSERT TO authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated update" ON client_acquisition;
    CREATE POLICY "Allow authenticated update" ON client_acquisition FOR UPDATE TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated delete" ON client_acquisition;
    CREATE POLICY "Allow authenticated delete" ON client_acquisition FOR DELETE TO authenticated USING (true);
  `;

  // Check if we have an exec_sql RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (rpcError) {
    console.error("Error executing SQL via RPC:", rpcError);
    console.log("Attempting to verify table existence via SELECT...");
    const { error: selectError } = await supabase.from('client_acquisition').select('*').limit(1);
    if (selectError) {
      console.log("Table definitely does not exist or access denied.");
    } else {
      console.log("Table exists.");
    }
  } else {
    console.log("SQL executed successfully.");
  }
}

setup();
