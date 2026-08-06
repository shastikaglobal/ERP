const http = require('http');

const BASE_HOST = 'localhost';
const BASE_PORT = 8082;
let cookies = '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE_HOST,
      port: BASE_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies ? { 'Cookie': cookies } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(options, (res) => {
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookies = setCookie.map(c => c.split(';')[0]).join('; ');
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch(e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  const login = await request('POST', '/api/auth/login', {
    email: 'kim.swathi.07@gmail.com',
    password: 'admin123'
  });
  console.log('Login:', login.status);
  if (login.status !== 200) { console.error('Login failed:', login.data); return; }

  // Get profile with company_id - try different endpoints
  let company_id;
  const me1 = await request('GET', '/api/profile');
  const me2 = await request('GET', '/api/profiles/me');
  const me3 = await request('GET', '/api/auth/me');
  console.log('profile:', JSON.stringify(me1.data).slice(0, 200));
  console.log('profiles/me:', JSON.stringify(me2.data).slice(0, 200));
  console.log('auth/me:', JSON.stringify(me3.data).slice(0, 200));
  
  company_id = me1.data?.company_id || me2.data?.company_id || me3.data?.company_id 
    || me1.data?.user?.company_id || me2.data?.user?.company_id || me3.data?.user?.company_id;

  if (!company_id) {
    // Try getting from farmers list (it will filter by user's company internally)
    const f0 = await request('GET', '/api/farmers');
    console.log('farmers no company_id:', f0.status, JSON.stringify(f0.data).slice(0, 200));
    // Try hardcoding known company_id from previous tests
    company_id = '00000000-0000-0000-0000-00000000ae01';
    console.log('Using hardcoded company_id:', company_id);
  }

  const farmers = await request('GET', `/api/farmers?company_id=${company_id}`);
  console.log('Farmers:', farmers.status, 'count:', Array.isArray(farmers.data) ? farmers.data.length : farmers.data);
  const farmer = Array.isArray(farmers.data) && farmers.data[0];
  if (!farmer) { console.error('No farmers found'); return; }
  const farmer_id = farmer.id;
  console.log('Using farmer:', farmer_id, farmer.full_name);

  const results = {};

  async function testModule(name, postPath, postBody, getPath) {
    console.log(`\n--- ${name} ---`);
    const pr = await request('POST', postPath, { ...postBody, company_id });
    console.log(`POST ${postPath}: ${pr.status}`);
    if (pr.status !== 200 && pr.status !== 201) {
      console.error('POST FAILED:', JSON.stringify(pr.data));
      results[name] = 'FAIL POST ' + pr.status + ': ' + (pr.data?.error || JSON.stringify(pr.data).slice(0,100));
      return;
    }
    const inserted_id = pr.data?.id;
    console.log('Inserted id:', inserted_id);

    const gr = await request('GET', `${getPath}?company_id=${company_id}`);
    console.log(`GET ${getPath}: ${gr.status}, count:`, Array.isArray(gr.data) ? gr.data.length : '?');
    if (!Array.isArray(gr.data)) {
      results[name] = 'FAIL GET: ' + JSON.stringify(gr.data).slice(0, 100);
      return;
    }
    const found = gr.data.find(r => r.id === inserted_id);
    console.log('Row in GET:', found ? 'YES ✓' : 'NO ✗');
    if (found) console.log('Row data:', JSON.stringify(found).slice(0, 200));
    results[name] = found ? 'PASS' : 'FAIL: row not in GET';
  }

  await testModule('Farm Visits',
    '/api/farmers/visits',
    { farmer_id, date: '2026-08-10T10:00:00Z', status: 'Scheduled', notes: 'E2E API Test' },
    '/api/farmers/visits'
  );

  await testModule('Supply Commitments',
    '/api/farmers/commitments',
    { farmer_id, crop: 'Wheat E2E', status: 'Pending', quantity: 100, delivery_date: '2026-09-01T00:00:00Z' },
    '/api/farmers/commitments'
  );

  await testModule('Ratings',
    '/api/farmers/ratings',
    { farmer_id, score: 4.0, review: 'E2E Test Rating' },
    '/api/farmers/ratings'
  );

  await testModule('Payouts',
    '/api/farmers/payouts',
    { farmer_id, amount: 5000, status: 'Pending', payout_date: '2026-09-01T00:00:00Z', notes: 'E2E Test' },
    '/api/farmers/payouts'
  );

  await testModule('Support Tickets',
    '/api/farmers/tickets',
    { farmer_id, issue: 'Payment Delay: E2E Test', status: 'Open', resolution: '' },
    '/api/farmers/tickets'
  );

  await testModule('Collections',
    '/api/farmers/collections',
    { farmer_id, crop: 'Wheat', status: 'Pending', quantity_collected: 50, quality_grade: 'A', collection_date: new Date().toISOString() },
    '/api/farmers/collections'
  );

  // Contracts dropdown
  const cr = await request('GET', `/api/farmers/contracts?company_id=${company_id}`);
  console.log(`\n--- Contracts dropdown ---`);
  console.log(`GET /contracts: ${cr.status}, count:`, Array.isArray(cr.data) ? cr.data.length : JSON.stringify(cr.data).slice(0,100));
  results['Contracts Dropdown'] = Array.isArray(cr.data) && cr.data.length > 0
    ? `PASS (${cr.data.length} contracts)`
    : `NONE (0 contracts - create via Contract Farming first)`;

  console.log('\n====== FINAL RESULTS ======');
  let allPass = true;
  for (const [k, v] of Object.entries(results)) {
    const ok = v.startsWith('PASS') || v.startsWith('NONE');
    console.log(`${ok ? '✓' : '✗'} ${k}: ${v}`);
    if (!ok) allPass = false;
  }
  console.log('\nOverall:', allPass ? 'ALL PASS ✓' : 'SOME FAILURES ✗');
}

main().catch(err => console.error('FATAL:', err.stack));
