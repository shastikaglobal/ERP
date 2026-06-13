const fetch = require('node-fetch');

async function run() {
  try {
    const url = 'http://195.35.22.13/iclock/cdata?SN=TEST_DEV&table=ATTLOG';
    const body = '1005\t2026-06-12 20:00:00\t1\t0\t0\t0\n';

    console.log("Sending mock punch to VPS ADMS sync server...");
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: body
    });

    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
