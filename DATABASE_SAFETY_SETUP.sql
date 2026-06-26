-- DATABASE SAFETY & AUTO SOFT-DELETE TRIGGERS SETUP
-- This script prevents any data from being permanently deleted (hard-deleted) from the database.
-- 1. Copies deleted rows as JSONB to public.deleted_records_archive
-- 2. Automatically updates is_deleted = true where the column exists
-- 3. Returns NULL to cancel the actual DELETE statement

-- 1. Create the Archive Table
CREATE TABLE IF NOT EXISTS public.deleted_records_archive (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT,
    record_data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by UUID
);

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.soft_delete_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    column_exists boolean;
    id_exists boolean;
    record_id_val text;
    auth_uid uuid;
BEGIN
    -- Capture the user ID if available (e.g. from Supabase JWT context)
    BEGIN
        auth_uid := (SELECT auth.uid() LIMIT 1);
    EXCEPTION WHEN OTHERS THEN
        auth_uid := NULL;
    END;

    -- Try to extract record ID if 'id' exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = TG_TABLE_SCHEMA 
          AND table_name = TG_TABLE_NAME 
          AND column_name = 'id'
    ) INTO id_exists;

    IF id_exists THEN
        BEGIN
            record_id_val := OLD.id::text;
        EXCEPTION WHEN OTHERS THEN
            record_id_val := NULL;
        END;
    ELSIF TG_TABLE_NAME = 'user_roles' THEN
        record_id_val := OLD.user_id::text || '_' || OLD.role_id::text;
    ELSE
        record_id_val := NULL;
    END IF;

    -- Archive the entire OLD record as JSONB
    INSERT INTO public.deleted_records_archive (table_name, record_id, record_data, deleted_at, deleted_by)
    VALUES (
        TG_TABLE_NAME, 
        record_id_val, 
        to_jsonb(OLD), 
        NOW(), 
        auth_uid
    );

    -- Check if 'is_deleted' exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = TG_TABLE_SCHEMA 
          AND table_name = TG_TABLE_NAME 
          AND column_name = 'is_deleted'
    ) INTO column_exists;

    IF column_exists THEN
        IF id_exists THEN
            -- Convert DELETE to soft-delete UPDATE
            EXECUTE format(
                'UPDATE %I.%I SET is_deleted = true, deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
                TG_TABLE_SCHEMA, TG_TABLE_NAME
            ) USING auth_uid, OLD.id;
        ELSIF TG_TABLE_NAME = 'user_roles' THEN
            UPDATE public.user_roles 
            SET is_deleted = true, deleted_at = NOW(), deleted_by = auth_uid 
            WHERE user_id = OLD.user_id AND role_id = OLD.role_id;
        END IF;
    END IF;

    -- Return NULL to cancel the actual DELETE operation
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Dynamic DO Block to Attach the Trigger to All Base Tables in Public Schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (
              'deleted_records_archive', 
              'schema_migrations', 
              'active_sessions', 
              'user_sessions',
              'audit_logs',
              'activity_logs',
              'crm_audit_log',
              'approval_audit_log'
          )
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE 'sql_%'
    LOOP
        -- Drop existing safety trigger if any
        EXECUTE format('DROP TRIGGER IF EXISTS trg_soft_delete_prevent ON public.%I', r.table_name);
        
        -- Create new trigger BEFORE DELETE
        EXECUTE format('
            CREATE TRIGGER trg_soft_delete_prevent
            BEFORE DELETE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.soft_delete_trigger_fn()
        ', r.table_name);
    END LOOP;
END;
$$;
