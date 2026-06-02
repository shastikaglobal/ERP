import fs from 'fs';
import path from 'path';

const PROJECT_REF = "sxebygxpjzntogzpjnga";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyNzkzOSwiZXhwIjoyMDkyOTAzOTM5fQ.ke2FGR_2LlFLXziLRewOH3isT6xZGQ29AQQu-u5l9eI";

async function deployAndRun() {
  const codePath = path.join(process.cwd(), 'supabase', 'functions', 'run-migration', 'index.ts');
  const code = fs.readFileSync(codePath, 'utf8');

  console.log("🚀 Deploying temporary run-migration Edge Function...");

  const deployResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/run-migration`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'run-migration',
      slug: 'run-migration',
      body: code,
      verify_jwt: false
    })
  });

  if (!deployResponse.ok) {
    const err = await deployResponse.json();
    console.error("❌ Deployment failed:", err.message || err);
    return;
  }

  console.log("✅ Temporary Edge Function deployed successfully.");
  console.log("🏃 Executing migration via Edge Function...");

  // Call the function
  const runResponse = await fetch(`https://sxebygxpjzntogzpjnga.supabase.co/functions/v1/run-migration`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await runResponse.json();
  console.log("📊 Migration Result:", result);

  // Clean up: delete the function
  console.log("🧹 Cleaning up temporary Edge Function...");
  const deleteResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/run-migration`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });

  if (deleteResponse.ok) {
    console.log("✅ Temporary Edge Function deleted successfully.");
  } else {
    console.warn("⚠️ Failed to delete temporary Edge Function.");
  }
}

deployAndRun();
