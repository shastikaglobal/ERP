const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'VITE_SUPABASE_URL') url = parts[1].trim().replace(/['"]/g, '');
  if (parts[0] === 'VITE_SUPABASE_ANON_KEY') key = parts[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function run() {
  const { data: emails, error: emailError } = await supabase
    .from('emails')
    .select('id, subject, from_address, body_text, received_at')
    .order('received_at', { ascending: false })
    .limit(10);

  if (emailError) {
    console.error("DB Error:", emailError);
    return;
  }

  emails.forEach(email => {
    console.log(`- From: ${email.from_address} | Subject: ${email.subject} | Text snippet: ${email.body_text?.substring(0, 50)}...`);
  });
}

run();
