import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHistory() {
  console.log("Checking team_chat history...");
  
  const { data, error, count } = await supabase
    .from('team_chat')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Total messages in database: ${count}`);
  if (data.length > 0) {
    console.log("Oldest message date:", data[data.length - 1].created_at);
    console.log("Newest message date:", data[0].created_at);
  }
}

checkHistory();
