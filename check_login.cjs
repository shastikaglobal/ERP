fetch('http://localhost:8082/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'kim.swathi.07@gmail.com', password: 'temp-1007' }) })
  .then(r => r.json().then(data => ({status: r.status, data})))
  .then(console.log)
  .catch(console.error);
