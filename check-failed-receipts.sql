SELECT 
  id,
  file_name,
  file_path,
  processing_status,
  processing_error,
  created_at
FROM receipts
WHERE file_name LIKE 'Yang_med_01%'
ORDER BY created_at DESC;
