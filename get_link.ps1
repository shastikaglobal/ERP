$response = Invoke-RestMethod -Uri http://localhost:8082/api/auth/reset-password -Method POST -Headers @{'Content-Type'='application/json'} -Body '{"email":"kim.swathi.07@gmail.com"}'
$response | ConvertTo-Json
