-- =====================================================
-- Check for Multiple Profiles Tables and Schema Issues
-- =====================================================

-- 1. Find ALL tables named 'profiles' in ANY schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. Check columns in public.profiles specifically
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if there's a profiles table in other schemas
SELECT
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY table_schema, ordinal_position;

-- 4. Check PostgREST schema cache
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('public', 'api', 'postgrest');

-- 5. Try direct SELECT on the actual table
SELECT
    id,
    full_name,
    credits,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
LIMIT 3;
