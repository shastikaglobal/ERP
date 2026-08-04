fetch('http://localhost:8082/api/employees/lookup-id/2001')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
