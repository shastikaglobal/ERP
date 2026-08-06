const fetch = require('node-fetch');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzIyZWNjOC1lYzFmLTRhZmItYWNmOC00NDRkM2JkYmE2NzciLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODU5MjU4ODcsImV4cCI6MTc4NTk2MTg4N30.eicX0xXgavgBWqAMkqBvZbSN7skp5ysZ6T00l79tTaE';
  
  try {
    const res = await fetch('http://localhost:8082/api/farmers/tickets?company_id=00000000-0000-0000-0000-00000000ae01', {
      headers: {
        'Cookie': `accessToken=${token}`
      }
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
})();
