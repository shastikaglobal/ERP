import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAllTables() {
  try {
    const res = await fetch(`https://sxebygxpjzntogzpjnga.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (res.ok) {
      const openapi = await res.json();
      console.log("All tables in Supabase PostgREST schema:");
      console.log(Object.keys(openapi.definitions || {}));
      
      const tablesToCheck = ['suppliers', 'activities', 'payments', 'overdue_payments', 'user_preferences'];
      for (const table of tablesToCheck) {
        const def = openapi.definitions?.[table];
        if (def) {
          console.log(`\nTable: ${table}`);
          console.log("Required columns:", def.required);
          console.log("Columns detail:", Object.keys(def.properties || {}));
        } else {
          console.log(`\nTable/View ${table} not found in OpenAPI spec.`);
        }
      }
    } else {
      console.error("PostgREST Schema Error:", await res.text());
    }
  } catch (err) {
    console.error("PostgREST Schema Exception:", err.message);
  }
}

async function main() {
  await checkAllTables();
}
main();
