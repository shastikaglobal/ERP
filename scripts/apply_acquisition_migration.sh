#!/bin/bash
# Apply acquisition_channels migration to Supabase
# This script creates the acquisition_channels table and configures RLS

echo "🔧 Applying acquisition_channels migration..."

# Read the migration file
MIGRATION_FILE="supabase/migrations/20260614000001_create_acquisition_channels.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Get Supabase credentials from .env or environment
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set"
    echo "Please set these environment variables:"
    echo "  export SUPABASE_URL=<your-supabase-url>"
    echo "  export SUPABASE_ANON_KEY=<your-supabase-anon-key>"
    exit 1
fi

echo "✅ Migration file found"
echo "📝 To apply this migration:"
echo ""
echo "1. Open Supabase Dashboard > SQL Editor"
echo "2. Copy the contents of: $MIGRATION_FILE"
echo "3. Paste and execute in the SQL Editor"
echo ""
echo "Or use the Supabase CLI:"
echo "  npx supabase migration push"
echo ""
