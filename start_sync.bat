@echo off
title eSSL Biometric Sync Services
echo Starting SQL Server Database...
net start MSSQL$SQLEXPRESS

echo Starting Biometric IP to Local DB Sync...
start cmd /k "cd /d "%~dp0" && python essl_device_sync.py"

echo Starting Local DB to Cloud ERP Sync...
start cmd /k "cd /d "%~dp0" && node essl-mssql-sync.js"

echo All sync services launched!
timeout /t 5
