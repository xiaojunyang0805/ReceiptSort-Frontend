# Database Migration Guide - Day 3 Processing Fields

## Overview
This migration adds two new fields to the `receipts` table to support AI processing functionality:
- `raw_ocr_text` - Stores the full OCR text extracted by OpenAI Vision API
- `processing_error` - Stores error messages if receipt processing fails

## Why These Fields Are Needed

### 1. `raw_ocr_text` (TEXT)
- **Purpose**: Store the complete OCR output from OpenAI Vision API
- **Used by**: `/api/receipts/[id]/process` endpoint
- **Benefits**:
  - Allows users to review what AI "saw" on the receipt
  - Helpful for debugging extraction issues
  - Can be used for future re-processing or corrections
  - Searchable text for finding receipts by content

### 2. `processing_error` (TEXT)
- **Purpose**: Store error messages when AI processing fails
- **Used by**: Both single and bulk processing endpoints
- **Benefits**:
  - Users can see why processing failed
  - Helps with debugging and support
  - Allows retry logic based on error type
  - Tracks failure patterns

## How to Apply This Migration

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `receiptsort`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration SQL**
   ```sql
   -- Migration: Add processing fields to receipts table
   -- Created: 2025-10-05

   -- Add raw_ocr_text field to store full OCR output from OpenAI
   ALTER TABLE receipts
   ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;

   -- Add processing_error field to store error messages if processing fails
   ALTER TABLE receipts
   ADD COLUMN IF NOT EXISTS processing_error TEXT;

   -- Add comment for documentation
   COMMENT ON COLUMN receipts.raw_ocr_text IS 'Full OCR text extracted from receipt by OpenAI Vision API';
   COMMENT ON COLUMN receipts.processing_error IS 'Error message if receipt processing failed';
   ```

4. **Run the Query**
   - Click "Run" button
   - You should see: "Success. No rows returned"

5. **Verify the Migration**
   ```sql
   -- Check if columns were added
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'receipts'
   ORDER BY ordinal_position;
   ```

### Method 2: Using Migration File

If you have Supabase CLI installed:

```bash
# Apply the migration
supabase db push migrations/001_add_processing_fields.sql
```

## Current Receipts Table Structure

After migration, your receipts table will have these fields:

```sql
receipts
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → profiles.id)
├── file_name (TEXT) - Original filename
├── file_path (TEXT) - Storage path
├── file_url (TEXT) - Public URL (deprecated, using signed URLs now)
├── file_type (TEXT) - MIME type
├── file_size (INTEGER) - File size in bytes
├── processing_status (TEXT) - 'pending' | 'processing' | 'completed' | 'failed'
├── merchant_name (TEXT) - Extracted merchant name
├── total_amount (DECIMAL) - Extracted total amount
├── currency (TEXT) - Currency code (USD, EUR, etc.)
├── receipt_date (DATE) - Date from receipt
├── category (TEXT) - Categorization
├── tax_amount (DECIMAL) - Tax amount
├── payment_method (TEXT) - Payment method used
├── confidence_score (DECIMAL) - AI confidence (0-1)
├── notes (TEXT) - User notes
├── raw_ocr_text (TEXT) - **NEW** Full OCR text from AI
├── processing_error (TEXT) - **NEW** Error message if failed
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## How These Fields Are Used in Code

### In Single Processing Endpoint (`/api/receipts/[id]/process`)

```typescript
// On Success - saves extracted OCR text
await supabase.from('receipts').update({
  raw_ocr_text: extractedData.raw_text,
  processing_status: 'completed',
  // ... other extracted fields
})

// On Failure - saves error message
await supabase.from('receipts').update({
  processing_status: 'failed',
  processing_error: errorMessage,
})
```

### In Bulk Processing Endpoint (`/api/receipts/process-bulk`)

```typescript
// Each receipt in the batch
for (const receiptId of receipt_ids) {
  try {
    // Success case
    await supabase.from('receipts').update({
      raw_ocr_text: extractedData.raw_text,
      processing_status: 'completed',
    })
  } catch (error) {
    // Failure case
    await supabase.from('receipts').update({
      processing_status: 'failed',
      processing_error: error.message,
    })
  }
}
```

## Rollback Instructions

If you need to remove these fields:

```sql
-- Remove the new columns
ALTER TABLE receipts DROP COLUMN IF EXISTS raw_ocr_text;
ALTER TABLE receipts DROP COLUMN IF EXISTS processing_error;
```

## Testing the Migration

After applying the migration, verify it works:

1. **Check column exists**:
   ```sql
   SELECT raw_ocr_text, processing_error
   FROM receipts
   LIMIT 1;
   ```
   Should return without error (values will be NULL for existing records)

2. **Test insert**:
   ```sql
   UPDATE receipts
   SET raw_ocr_text = 'Test OCR text',
       processing_error = NULL
   WHERE id = 'your-receipt-id';
   ```

## Common Issues

### Issue: "Column already exists"
**Solution**: The migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: "Permission denied"
**Solution**: Make sure you're running the query as the database owner or have ALTER TABLE permissions.

### Issue: RLS policies block updates
**Solution**: The existing RLS policies allow authenticated users to update their own receipts, so this should work automatically.

## Next Steps After Migration

1. ✅ Migration applied
2. Deploy the updated API endpoints to production
3. Test processing with a sample receipt
4. Monitor logs for any issues
5. Update frontend UI to show `raw_ocr_text` and `processing_error` to users

## Support

If you encounter any issues with the migration:
1. Check Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have proper permissions
4. Try the rollback and re-apply
