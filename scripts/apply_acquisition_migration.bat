@echo off
REM Apply acquisition_channels migration to Supabase
REM This script creates the acquisition_channels table and configures RLS

echo.
echo ===================================
echo Client Acquisition Migration Setup
echo ===================================
echo.

set "MIGRATION_FILE=supabase\migrations\20260614000001_create_acquisition_channels.sql"

if not exist "%MIGRATION_FILE%" (
    echo Error: Migration file not found: %MIGRATION_FILE%
    exit /b 1
)

echo Migration file found: %MIGRATION_FILE%
echo.
echo To apply this migration to your Supabase database:
echo.
echo Option 1: Using Supabase Dashboard (Recommended)
echo   1. Go to https://app.supabase.com
echo   2. Select your project
echo   3. Navigate to SQL Editor
echo   4. Create a new query
echo   5. Copy and paste the contents of: %MIGRATION_FILE%
echo   6. Click "Run" to execute
echo.
echo Option 2: Using Supabase CLI
echo   npx supabase migration push
echo.
echo After applying the migration:
echo   - The acquisition_channels table will be created
echo   - Default channels will be seeded for your company
echo   - RLS policies will be configured
echo   - source_id foreign key will be added to leads table (if not exists)
echo.
echo Then refresh your browser to see the Client Acquisition data!
echo.
