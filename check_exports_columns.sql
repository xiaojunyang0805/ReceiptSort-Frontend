-- Check actual column names in exports table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exports'
ORDER BY ordinal_position;
