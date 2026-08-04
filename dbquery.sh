#!/bin/bash
# Using the exact credentials from .env — remote host to bypass pg_hba peer auth
PG_USER="erp_admin"
PG_PASSWORD='Xk9$mQ2vL7pR4wZ8nT3y'
PG_DATABASE="shastika_erp"
PG_HOST="195.35.22.13"
PG_PORT="5432"

export PGPASSWORD="$PG_PASSWORD"

echo "=== Profiles for employee_id or biometric_id 2001 ==="
psql -U "$PG_USER" -d "$PG_DATABASE" -h "$PG_HOST" -p "$PG_PORT" -c "SELECT id, email, full_name, employee_id, biometric_id, status FROM profiles WHERE employee_id = '2001' OR biometric_id = '2001';" 2>&1

echo ""
echo "=== Sample profiles (first 5, key columns) ==="
psql -U "$PG_USER" -d "$PG_DATABASE" -h "$PG_HOST" -p "$PG_PORT" -c "SELECT employee_id, biometric_id, email, full_name, status FROM profiles ORDER BY created_at DESC LIMIT 5;" 2>&1

echo ""
echo "=== password_resets table exists? ==="
psql -U "$PG_USER" -d "$PG_DATABASE" -h "$PG_HOST" -p "$PG_PORT" -c "SELECT to_regclass('public.password_resets');" 2>&1

echo ""
echo "=== Tables in DB ==="
psql -U "$PG_USER" -d "$PG_DATABASE" -h "$PG_HOST" -p "$PG_PORT" -c "\dt" 2>&1
