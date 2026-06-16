const https = require('https');
const http = require('http');

// Test: call the production API to change a role and see what happens
// First let's see what the API returns when we hit it

const VPS_HOST = '195.35.22.13';
const PORT = 8082;

async function fetchApi(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: VPS_HOST,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        // No auth token - will get 401 but shows the endpoint exists
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Testing production API endpoints...\n');

  // Test 1: GET /api/employees/all/profiles - does it exist?
  const r1 = await fetchApi('/api/employees/all/profiles');
  console.log('GET /api/employees/all/profiles:', r1.status, r1.body.slice(0, 100));

  // Test 2: PUT /api/employees/all/profiles/:id
  const r2 = await fetchApi('/api/employees/all/profiles/test-id', 'PUT', { requested_role: 'bde' });
  console.log('PUT /api/employees/all/profiles/:id:', r2.status, r2.body.slice(0, 200));

  // Test 3: GET /api/employees
  const r3 = await fetchApi('/api/employees');
  console.log('GET /api/employees:', r3.status, r3.body.slice(0, 100));
}

run().catch(console.error);
