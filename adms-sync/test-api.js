const http = require('http');

async function check(urlStr) {
  return new Promise((resolve) => {
    const req = http.get(urlStr, (res) => {
      if (res.statusCode === 200) {
        console.log(`PASS: GET ${urlStr} (Status: ${res.statusCode})`);
        resolve(true);
      } else {
        console.log(`FAIL: GET ${urlStr} (Status: ${res.statusCode})`);
        resolve(false);
      }
    });
    req.on('error', (e) => {
      console.log(`FAIL: GET ${urlStr} (Error: ${e.message})`);
      resolve(false);
    });
    req.setTimeout(5000, () => {
      console.log(`FAIL: GET ${urlStr} (Timeout)`);
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  const baseUrl = 'http://localhost:5000'; // Assuming the backend runs on port 5000
  console.log('Running Smoke Test...');
  
  await check(`${baseUrl}/api/health`);
  await check(`${baseUrl}/api/farmers?company_id=00000000-0000-0000-0000-00000000ae01`);
  await check(`${baseUrl}/api/farmers/commitments?company_id=00000000-0000-0000-0000-00000000ae01`);
  
  console.log('Smoke Test Complete.');
}

run();
