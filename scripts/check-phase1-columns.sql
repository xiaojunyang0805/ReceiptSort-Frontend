-- Check if Phase 1 columns exist in receipts table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'receipts'
  AND column_name IN ('invoice_number', 'document_type', 'subtotal', 'vendor_address', 'due_date')
ORDER BY column_name;

-- If no results, the columns don't exist yet - run the migration!
