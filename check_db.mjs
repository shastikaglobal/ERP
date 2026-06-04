
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase.from('customers').select('*').limit(1)
  if (error) {
    console.error('Error fetching customers:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('Available columns in customers table:', Object.keys(data[0]))
  } else {
    console.log('Customers table is empty, cannot check columns easily via fetch.')
  }
}

checkColumns()
