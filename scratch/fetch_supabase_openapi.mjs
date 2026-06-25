import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read environment variables
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

async function run() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase url or service role key");
    return;
  }

  console.log(`Fetching OpenAPI/Swagger schema from ${supabaseUrl}/rest/v1/...`);
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch schema:", response.statusText);
    return;
  }

  const swagger = await response.json();
  console.log("Successfully fetched Supabase Swagger schema!");

  // List all tables and columns
  const tables = {};
  if (swagger.definitions) {
    Object.keys(swagger.definitions).forEach(tableName => {
      const def = swagger.definitions[tableName];
      tables[tableName] = Object.keys(def.properties || {}).map(colName => {
        const prop = def.properties[colName];
        return {
          name: colName,
          type: prop.type,
          format: prop.format,
          description: prop.description
        };
      });
    });
  }

  // List all RPCs
  const rpcs = [];
  if (swagger.paths) {
    Object.keys(swagger.paths).forEach(pathName => {
      if (pathName.startsWith('/rpc/')) {
        rpcs.push(pathName.substring(5));
      }
    });
  }

  const output = {
    tables,
    rpcs
  };

  fs.writeFileSync(path.join(__dirname, 'supabase_openapi_metadata.json'), JSON.stringify(output, null, 2));
  console.log(`Found ${Object.keys(tables).length} tables and ${rpcs.length} RPCs.`);
  console.log("Supabase metadata saved to supabase_openapi_metadata.json");
}

run().catch(console.error);
