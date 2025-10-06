-- Test manual insert to exports table
-- Replace YOUR_USER_ID with your actual user ID: 90123fcc-52ef-4895-aa1b-959318f5358a

INSERT INTO exports (user_id, export_type, receipt_count, file_name)
VALUES (
  '90123fcc-52ef-4895-aa1b-959318f5358a',
  'excel',
  2,
  'test-manual-insert.xlsx'
);

-- Check if it was inserted
SELECT * FROM exports WHERE user_id = '90123fcc-52ef-4895-aa1b-959318f5358a';
