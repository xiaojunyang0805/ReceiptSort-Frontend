-- Verify current policies after cleanup
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'exports'
ORDER BY cmd, policyname;
