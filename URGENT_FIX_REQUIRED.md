# 🚨 URGENT: Required Fixes for Phase 1 Deployment

## Issues Identified:

### Issue 1: Receipt Processing Failure ❌
**Error:** "Failed to update receipt with extracted data"
**Cause:** Database migration for Phase 1 columns has NOT been executed yet
**Impact:** ALL receipt processing is failing (medical receipts, regular receipts, etc.)

### Issue 2: Translation Button Display Bug ❌
**Error:** Button shows literal text "receiptsPage.processing.processAllButton" instead of translation
**Cause:** Unknown - needs investigation (possibly related to build/deployment)
**Impact:** Poor UX in Chinese language interface

---

## REQUIRED ACTIONS:

### ✅ Step 1: Run Database Migration (CRITICAL - DO THIS FIRST!)

**Location:** `database/migrations/20251014_phase1_essential_fields.sql`

**Instructions:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the ENTIRE contents of the migration file below
3. Execute the SQL
4. Verify success (should see "Success. No rows returned")

**Migration SQL:**
```sql
-- Phase 1: Essential Fields Migration
-- Add 5 essential fields for medical receipts and business invoices

-- Step 1: Add new columns to receipts table (all nullable for backward compatibility)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'receipt';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vendor_address TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS due_date DATE;

-- Step 2: Add index on document_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_receipts_document_type ON receipts(document_type);

-- Step 3: Add index on due_date for bill payment tracking queries
CREATE INDEX IF NOT EXISTS idx_receipts_due_date ON receipts(due_date);

-- Step 4: Backfill document_type for existing receipts (set to 'receipt')
UPDATE receipts
SET document_type = 'receipt'
WHERE document_type IS NULL;

-- Step 5: Add comment on new fields for documentation
COMMENT ON COLUMN receipts.invoice_number IS 'Invoice/receipt number from the document (critical for medical insurance reimbursement)';
COMMENT ON COLUMN receipts.document_type IS 'Type of document: receipt, invoice, medical_invoice, bill (auto-detected by AI)';
COMMENT ON COLUMN receipts.subtotal IS 'Amount before tax (required for accounting integration)';
COMMENT ON COLUMN receipts.vendor_address IS 'Full vendor address from the document';
COMMENT ON COLUMN receipts.due_date IS 'Payment due date (for invoices and bills)';
```

**Verification:**
Run this query to verify columns were created:
```sql
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
```

Expected result: 5 rows showing the new columns

---

### ✅ Step 2: Investigate Translation Bug

**Current Status:** Translation keys are correct in `messages/zh.json`

**Possible Causes:**
1. Build cache issue - may need fresh build/deploy
2. Next-intl configuration issue
3. Client/server component mismatch

**Recommended Actions:**
1. Clear Next.js build cache and rebuild
2. Redeploy to Vercel
3. If still persists, check browser console for errors

---

## Testing After Migration:

### Test 1: Process Medical Receipt
1. Upload `test-receipts/Yang_med_01.png`
2. Click "Retry Processing" on the failed receipt
3. Verify it processes successfully
4. Open Receipt Details modal
5. Verify new fields are populated:
   - Document Type: "medical_invoice" or "receipt"
   - Invoice Number: Should show invoice number if detected
   - Subtotal, Due Date, Vendor Address (if applicable)

### Test 2: Export Functionality
1. Export receipts to CSV
2. Verify CSV has new columns: Document Type, Invoice#, Subtotal, Vendor Address, Due Date
3. Export receipts to Excel
4. Verify Excel has 13 columns total (was 8, now 13)

### Test 3: Translation (Chinese Interface)
1. Switch to Chinese language
2. Navigate to Receipts page
3. Verify "Process All Pending" button shows Chinese text, not "receiptsPage.processing.processAllButton"

---

## Quick Fix Commands (if needed):

### Rebuild Application:
```bash
cd receiptsort
npm run build
```

### Clear Next.js Cache:
```bash
cd receiptsort
rm -rf .next
npm run build
```

### Redeploy to Vercel:
```bash
cd receiptsort
vercel --prod
```

---

## Expected Outcome After Fixes:

✅ Medical receipts process successfully
✅ All receipt types extract Phase 1 fields
✅ Receipt Details modal shows new fields conditionally
✅ CSV/Excel exports include new columns
✅ Chinese translation displays correctly

---

## Support Files Created:

- `scripts/check-phase1-columns.sql` - Verify migration status
- `URGENT_FIX_REQUIRED.md` - This file

---

**Priority:** CRITICAL - Users cannot process receipts until migration is run
**Estimated Fix Time:** 5 minutes (just run the SQL migration)
