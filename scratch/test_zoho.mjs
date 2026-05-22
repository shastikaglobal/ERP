import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyNzkzOSwiZXhwIjoyMDkyOTAzOTM5fQ.ke2FGR_2LlFLXziLRewOH3isT6xZGQ29AQQu-u5l9eI";

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY
);

async function run() {
  const testPath = 'test-zoho-dummy.csv';
  const testFilename = 'dummy.csv';

  // 1. Create a dummy CSV file buffer
  const buffer = Buffer.from('Column1,Column2,Column3\nValue1,Value2,Value3\n');

  console.log(`Uploading dummy CSV file to bucket 'email-attachments' at path '${testPath}'...`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('email-attachments')
    .upload(testPath, buffer, {
      contentType: 'text/csv',
      upsert: true
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return;
  }
  console.log("Upload successful:", uploadData);

  console.log("Invoking zoho-office-integrator edge function...");
  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke("zoho-office-integrator", {
      body: {
        path: testPath,
        filename: testFilename,
        displayName: "Test User",
        userId: "test-user-id",
      }
    });

    console.log("Function response error object:", functionError);
    console.log("Function response data object:", functionData);
  } catch (err) {
    console.error("Invocation error caught:", err);
  } finally {
    // Clean up
    console.log("Cleaning up dummy file from storage...");
    await supabase.storage.from('email-attachments').remove([testPath]);
  }
}

run();
