# Export History Not Showing - Debugging Guide

## Issue
Export History page shows "No exports yet" even after performing an export.

## Root Cause Analysis

**FIXED:** The issue was that the `exports` table was missing the `file_name` column.

The actual problem had TWO parts:
1. **Missing Column:** The table in Supabase had columns `receipt_ids` and `file_size` instead of `file_name`. Migration 003 was never applied or the table was created manually with different structure.
2. **RLS Policy:** The original INSERT policy used `WITH CHECK (auth.uid() = user_id)` which doesn't work with server-side API routes.

**Solution:**
- Added `file_name` column to exports table (migration 006)
- Changed INSERT policy to `WITH CHECK (true)` (migration 005)
- Made `receipt_ids` and `file_size` nullable since API doesn't use them

## How to Fix

### Option 1: Check if table exists in Supabase (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `receiptsort`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Check if exports table exists:**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name = 'exports'
   );
   ```
   - Run the query
   - If it returns `false`, the table doesn't exist → Go to Option 2

4. **If table exists, check for data:**
   ```sql
   SELECT * FROM exports ORDER BY created_at DESC LIMIT 10;
   ```
   - If no rows, the export API might be failing silently
   - Check browser console for errors when exporting

### Option 2: Apply the RLS policy fix (REQUIRED)

Run this SQL in Supabase SQL Editor to fix the INSERT policy:

```sql
-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own exports" ON exports;

-- Create new INSERT policy that works with server-side Supabase client
CREATE POLICY "Allow authenticated inserts to exports"
  ON exports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

This allows server-side API routes to insert export records. The user_id is still validated in the application code, and users can only view their own exports (SELECT policy unchanged).

### Option 3: Check browser console for errors

1. **Open browser DevTools**
   - Press F12 (or Cmd+Option+I on Mac)
   - Go to "Console" tab

2. **Try exporting again**
   - Go to Dashboard → Select receipts → Export to Excel

3. **Look for errors**
   - Any red error messages?
   - Look for `[Excel Export]` or `[CSV Export]` logs
   - Check Network tab for failed API requests

### Option 4: Verify export API is being called

1. **Open DevTools Network tab**
   - Press F12 → Click "Network" tab
   - Filter by "Fetch/XHR"

2. **Export receipts**
   - Click "Export to Excel" in dashboard

3. **Check the request**
   - Should see POST request to `/api/export/excel`
   - Click on it → Check "Response" tab
   - Should see Excel file download (not an error)

## Expected Behavior After Fix

After the migration is applied:
1. Export receipts from Dashboard
2. Go to Export History page
3. You should see a table with:
   - Export Type (EXCEL or CSV badge)
   - File Name (e.g., "receipts-2025-10-06.xlsx")
   - Receipt count
   - Time created (e.g., "2 minutes ago")

## Common Issues

### Issue 1: RLS Policies blocking inserts
**Symptom:** API succeeds but no record in database
**Check:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'exports';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'exports';
```

### Issue 2: Export API fails silently
**Location:** `src/app/api/export/excel/route.ts` line 96-105
**Check:** The try-catch doesn't fail the export if logging fails
**Fix:** Check Supabase logs for errors

### Issue 3: Wrong user_id in insert
**Check:** Make sure the authenticated user ID matches
```sql
-- Check your user ID
SELECT auth.uid();

-- Check if any exports exist for this user
SELECT * FROM exports WHERE user_id = auth.uid();
```

## Testing

After applying the fix, test:

1. **Export a receipt**
   ```
   Dashboard → Select 1+ receipts → Export to Excel
   ```

2. **Verify in database**
   ```sql
   SELECT * FROM exports WHERE user_id = auth.uid() ORDER BY created_at DESC;
   ```

3. **Check Export History page**
   ```
   Navigate to /exports
   Should show your export
   ```

## Need More Help?

If the issue persists:
1. Share browser console errors
2. Share Supabase SQL query results
3. Check Supabase logs: Dashboard → Logs → API logs
