import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1]
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      user_agent,
      status,
      timestamp,
      profiles!inner(company_id, full_name, email)
    `)
  console.log('Select Result:', data, error)
}
test()
