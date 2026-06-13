// Test the API endpoints via HTTP
const http = require('http');

const BASE_URL = 'http://127.0.0.1:8082';
const COMPANY_ID = '00000000-0000-0000-0000-00000000ae01';
const TEST_TOKEN = 'Bearer test-token-for-testing';

async function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': TEST_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('🧪 TESTING BACKEND API ENDPOINTS VIA HTTP\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Company ID: ${COMPANY_ID}\n`);

    // Test 1: Won leads
    console.log('1️⃣  GET /api/leads/workflow/won-leads');
    console.log('═══════════════════════════════════════\n');
    const wonRes = await makeRequest('GET', `/api/leads/workflow/won-leads?company_id=${COMPANY_ID}`);
    console.log(`Status: ${wonRes.status}`);
    console.log(`Count: ${wonRes.data.length} records`);
    if (wonRes.data.length > 0) {
      console.log(`Sample: ${wonRes.data[0].company_name} (stage: ${wonRes.data[0].stage})`);
    }
    console.log('');

    // Test 2: Successful conversations
    console.log('2️⃣  GET /api/leads/workflow/successful-conversations');
    console.log('═══════════════════════════════════════\n');
    const succRes = await makeRequest('GET', `/api/leads/workflow/successful-conversations?company_id=${COMPANY_ID}`);
    console.log(`Status: ${succRes.status}`);
    console.log(`Count: ${succRes.data.length} records`);
    if (succRes.data.length > 0) {
      console.log(`Sample: ${succRes.data[0].company_name} (stage: ${succRes.data[0].stage})`);
    }
    console.log('');

    // Test 3: Client acquisition
    console.log('3️⃣  GET /api/leads/workflow/client-acquisition');
    console.log('═══════════════════════════════════════\n');
    const acqRes = await makeRequest('GET', `/api/leads/workflow/client-acquisition?company_id=${COMPANY_ID}`);
    console.log(`Status: ${acqRes.status}`);
    console.log(`Count: ${acqRes.data.length} records`);
    if (acqRes.data.length > 0) {
      console.log(`Sample: ${acqRes.data[0].company_name} (stage: ${acqRes.data[0].stage})`);
    }
    console.log('');

    // Verify data mapping
    console.log('✅ DATA MAPPING VERIFICATION');
    console.log('═══════════════════════════════════════\n');

    if (wonRes.status === 200 && wonRes.data.every(l => l.stage === 'Won')) {
      console.log('✅ Won leads endpoint: All records have stage = "Won"');
    } else {
      console.log('⚠️  Won leads endpoint: Some records may have incorrect stage');
    }

    if (succRes.status === 200 && succRes.data.every(l => l.stage === 'Won' || l.stage === null)) {
      console.log('✅ Successful conversations endpoint: Records are Won stage');
    }

    if (acqRes.status === 200 && acqRes.data.every(l => l.stage === 'Client Successfully Acquired')) {
      console.log('✅ Client acquisition endpoint: All records have stage = "Client Successfully Acquired"');
    } else {
      console.log('⚠️  Client acquisition endpoint: Some records may have incorrect stage');
    }

    console.log('\n✨ API TESTS COMPLETE');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running on port 8082');
      console.log('Please start the backend server: node adms-sync/server.js');
    }
  }
})();
