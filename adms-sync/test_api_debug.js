// Better HTTP test for debugging
const http = require('http');

const BASE_URL = 'http://127.0.0.1:8082';
const COMPANY_ID = '00000000-0000-0000-0000-00000000ae01';

async function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`Making request: ${method} ${url.pathname}${url.search}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: json 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            headers: res.headers,
            data: data.substring(0, 500) 
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('🧪 TESTING BACKEND API ENDPOINTS\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Company ID: ${COMPANY_ID}\n`);

    // Test basic connectivity
    console.log('Testing basic GET /');
    const basicRes = await makeRequest('GET', '/');
    console.log(`  Status: ${basicRes.status}`);
    console.log(`  Response type: ${typeof basicRes.data}`);
    console.log(`  Preview: ${typeof basicRes.data === 'string' ? basicRes.data.substring(0, 100) : JSON.stringify(basicRes.data).substring(0, 100)}`);
    console.log('');

    // Test workflow endpoints
    console.log('1️⃣  GET /api/leads/workflow/successful-conversations');
    const succRes = await makeRequest('GET', `/api/leads/workflow/successful-conversations?company_id=${COMPANY_ID}`);
    console.log(`  Status: ${succRes.status}`);
    if (succRes.status === 200) {
      console.log(`  ✅ Success! Records: ${succRes.data.length || 0}`);
      if (succRes.data.length > 0) {
        console.log(`  Sample: ${succRes.data[0].company_name} (stage: ${succRes.data[0].stage})`);
      }
    } else {
      console.log(`  ❌ Error response: ${succRes.status}`);
      if (typeof succRes.data === 'string') {
        console.log(`  Response: ${succRes.data.substring(0, 200)}`);
      } else {
        console.log(`  Response: ${JSON.stringify(succRes.data).substring(0, 200)}`);
      }
    }
    console.log('');

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running');
    }
  }
})();
