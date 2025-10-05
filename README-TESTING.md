# Quick Start: Testing Receipt Extraction

## 1. Add Test Credits

```bash
npm run seed:credits -- your-email@example.com 100
```

Replace `your-email@example.com` with your actual login email.

## 2. Upload Test Receipts

**Via Web UI:**
1. Login to http://localhost:3000 (or https://receiptsort.vercel.app)
2. Go to `/upload` page
3. Drag all files from `test-receipts/` folder
4. Wait for upload to complete

## 3. Process Receipts

**Option A: Process All at Once**
1. Go to `/dashboard`
2. Click "Process All Pending" button
3. Confirm dialog
4. Wait for completion

**Option B: Process Individual**
1. Go to `/receipts`
2. Click ⋮ menu on each receipt
3. Click "Process (1 credit)"

## 4. Check Accuracy

For each receipt, click "View Details" and verify:
- ✅ Merchant name is correct
- ✅ Total amount is exact
- ✅ Date is correct
- ✅ Category makes sense

## 5. Run Automated Tests (Optional)

First, update ground truth in `scripts/test-extraction.ts`, then:

```bash
npm run test:extraction
```

## 6. Reset Data (Start Fresh)

```bash
npm run seed:reset -- your-email@example.com
```

⚠️ This deletes all receipts!

---

## Expected Accuracy

- **Amount**: ≥90% (must be exact)
- **Date**: ≥90% (must be exact)
- **Merchant**: ≥80% (minor misspellings OK)
- **Category**: ≥70% (reasonable alternatives OK)

## Improve Accuracy

If accuracy is low, edit `src/lib/openai.ts`:
1. Update `RECEIPT_EXTRACTION_PROMPT` with clearer instructions
2. Add examples
3. Adjust temperature (0.0 - 0.3)
4. Re-test

See `TESTING_GUIDE.md` for detailed instructions.
