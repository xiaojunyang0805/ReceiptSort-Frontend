# Receipt Extraction Testing Guide

## Overview

This guide helps you test the OpenAI Vision API receipt extraction accuracy using the sample receipts in the `test-receipts/` folder.

## Test Receipts Available

- 11 sample receipt images (s01.webp - s10.jpg)
- Mix of formats: WEBP, PNG, JPG
- Various merchants: restaurants, retail, gas stations, etc.

## Testing Tools

### 1. Automated Extraction Test
**Script**: `scripts/test-extraction.ts`

Tests receipts against ground truth data and generates an accuracy report.

```bash
npm run test:extraction
```

**What it does:**
- Loads test receipts from `test-receipts/` folder
- Calls OpenAI Vision API for each receipt
- Compares extracted data with expected values
- Generates accuracy metrics
- Saves detailed results to `test-results.json`

**Accuracy Targets:**
- Amount: ≥90% (must be exact)
- Date: ≥90% (must be exact)
- Merchant Name: ≥80% (allows minor misspellings)
- Category: ≥70% (allows reasonable alternatives)

### 2. Add Test Credits
**Script**: `scripts/add-test-credits.ts`

Adds credits to your account for testing without purchasing.

```bash
npm run seed:credits -- your-email@example.com 100
```

**Arguments:**
- Email: Your user email address
- Amount: Number of credits to add (default: 100)

**Example:**
```bash
npm run seed:credits -- test@example.com 50
```

### 3. Reset Test Data
**Script**: `scripts/reset-test-data.ts`

Clears all receipts and resets credits for a fresh test.

```bash
npm run seed:reset -- your-email@example.com 10
```

**⚠️ WARNING:** This deletes ALL receipts for the user!

**What it does:**
- Deletes all receipt files from storage
- Removes all receipt database records
- Clears credit transaction history
- Resets credits to specified amount (default: 10)

## Manual Testing Workflow

### Step 1: Prepare Test Environment

1. **Add test credits:**
   ```bash
   npm run seed:credits -- your-email@example.com 100
   ```

2. **Verify credits in dashboard:**
   - Login to https://receiptsort.vercel.app/dashboard
   - Check credits balance shows 100+ credits

### Step 2: Upload Test Receipts

**Option A: Via UI (Recommended for first test)**
1. Go to `/upload` page
2. Drag and drop all files from `test-receipts/` folder
3. Wait for upload completion
4. Verify all receipts appear in `/receipts` with "Pending" status

**Option B: Via Script (Faster for repeated tests)**
```bash
# Upload all test receipts at once
# (You'll need to implement this if desired)
```

### Step 3: Process Receipts

**Single Receipt Processing:**
1. Go to `/receipts` page
2. Click ⋮ menu on a receipt
3. Click "Process (1 credit)"
4. Wait for toast notification
5. Verify:
   - Status changes to "Completed"
   - Extracted data appears in modal
   - Credits deducted by 1

**Bulk Processing:**
1. Go to `/dashboard` page
2. Click "Process All Pending (X)" button
3. Confirm dialog
4. Watch progress bar
5. Review summary toast

### Step 4: Evaluate Accuracy

For each processed receipt, check:

| Field | Check | Accuracy Requirement |
|-------|-------|---------------------|
| **Merchant Name** | Opens modal, verify name | ≥80% match (minor misspellings OK) |
| **Total Amount** | Check amount field | ≥90% exact match |
| **Date** | Check receipt date | ≥90% exact match |
| **Category** | Check category | ≥70% reasonable |
| **Currency** | Check currency code | Should be correct |
| **Tax Amount** | If visible | Nice to have |
| **Payment Method** | If visible | Nice to have |

### Step 5: Record Results

Use the provided `test-results-template.csv` to track accuracy:

```csv
filename,merchant_expected,merchant_extracted,merchant_match,amount_expected,amount_extracted,amount_match,date_expected,date_extracted,date_match,category_expected,category_extracted,category_reasonable,notes
s01.webp,Starbucks,Starbucks,✓,15.50,15.50,✓,2024-01-15,2024-01-15,✓,Food & Dining,Food & Dining,✓,Perfect
s02.png,Target,Target,✓,45.23,45.20,✗,2024-02-10,2024-02-10,✓,Shopping,Shopping,✓,Amount off by $0.03
```

## Automated Testing

### Running Automated Tests

1. **Update ground truth data** in `scripts/test-extraction.ts`:
   ```typescript
   const testReceipts: TestReceipt[] = [
     {
       filename: 's01.webp',
       expected: {
         merchant_name: 'Starbucks',
         amount: 15.50,
         currency: 'USD',
         date: '2024-01-15',
         category: 'Food & Dining',
       },
     },
     // Add more...
   ]
   ```

2. **Run tests:**
   ```bash
   npm run test:extraction
   ```

3. **Review report:**
   - Console output shows real-time progress
   - Check field-by-field accuracy
   - Review failed extractions
   - Check `test-results.json` for details

### Sample Output

```
🧪 Receipt Extraction Testing
============================================================
📁 Test Directory: /path/to/test-receipts
📝 Testing 10 receipts

📄 Testing: s01.webp
   Expected: Starbucks - $15.50
   Extracted: Starbucks - $15.50
   Confidence: 95%
   Time: 2341ms
   ✓ Merchant: ✓
   ✓ Amount: ✓
   ✓ Date: ✓
   ✓ Category: ✓

============================================================
📊 ACCURACY REPORT
============================================================

Total Tests: 10
Successful: 9 (90.0%)
Failed: 1 (10.0%)

📈 Field Accuracy:
   Merchant Name: 88.9% ✓ (target: 80%)
   Amount: 77.8% ✗ (target: 90%)
   Date: 88.9% ✗ (target: 90%)
   Category: 100.0% ✓ (target: 70%)

⏱️  Performance:
   Avg Confidence: 89.2%
   Avg Processing Time: 2156ms

💾 Detailed results saved to: test-results.json
```

## Improving Accuracy

If accuracy is below targets:

### 1. Improve System Prompt

Edit `src/lib/openai.ts` - `RECEIPT_EXTRACTION_PROMPT`:

**Add more specific instructions:**
```
- Look for the largest number with a currency symbol as the total
- Merchant name is typically at the TOP of the receipt in LARGE text
- Date formats: MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
```

**Add examples:**
```
Example 1:
STARBUCKS
123 Main St
...
TOTAL: $15.50
→ merchant_name: "Starbucks", amount: 15.50

Example 2:
Target #1234
Amount Due: $45.23
→ merchant_name: "Target", amount: 45.23
```

### 2. Adjust Temperature

Current: `temperature: 0.1` (very consistent)

- Lower (0.0): More deterministic, less creative
- Higher (0.3-0.5): More flexible, might help with edge cases

### 3. Increase Max Tokens

Current: `max_tokens: 500`

- Increase to 800 if receipts are complex
- More tokens = more detailed raw_text extraction

### 4. Change Image Detail Level

Current: `detail: 'high'`

- Already at highest setting
- Consider if image preprocessing needed (contrast, rotation)

### 5. Test Different Models

Current: `gpt-4-vision-preview`

- Try `gpt-4-turbo` (newer, potentially more accurate)
- Check OpenAI docs for latest vision models

## Continuous Testing

### After Each Prompt Change

1. Run automated tests:
   ```bash
   npm run test:extraction
   ```

2. Compare results with previous run

3. Track accuracy trends

4. Commit changes only if accuracy improves

### Test Coverage

Ensure test receipts cover:
- ✓ Different merchants (restaurants, retail, gas, etc.)
- ✓ Different receipt layouts
- ✓ Various amounts ($1.50 - $500+)
- ✓ Different date formats
- ✓ Clear vs blurry images
- ✓ Different currencies (USD, EUR, etc.)
- ✓ Handwritten vs printed
- ✓ Thermal vs ink printed

## Troubleshooting

### Issue: "OpenAI API quota exceeded"
**Solution:** Wait or upgrade OpenAI plan

### Issue: "Insufficient credits"
**Solution:**
```bash
npm run seed:credits -- your-email@example.com 100
```

### Issue: Low accuracy on amounts
**Checklist:**
- ✓ Are receipts high quality?
- ✓ Is "TOTAL" or "AMOUNT DUE" clearly visible?
- ✓ Are there multiple totals (subtotal vs total)?
- ✓ Update prompt to clarify which total to extract

### Issue: Wrong merchant names
**Checklist:**
- ✓ Is merchant name at TOP of receipt?
- ✓ Is it confused with store location/address?
- ✓ Update prompt: "Merchant name is ALWAYS at the top"

### Issue: Wrong dates
**Checklist:**
- ✓ What date format is used?
- ✓ Is there a "DATE" label?
- ✓ Could it be confusing date with receipt number?
- ✓ Add date format examples to prompt

## Next Steps

1. ✅ Run initial accuracy test
2. ✅ Identify problem areas
3. ✅ Improve prompt/settings
4. ✅ Re-test and verify improvement
5. ✅ Document findings
6. ✅ Deploy to production if accuracy > targets

---

**Goal:** Achieve 90%+ accuracy on amounts and dates before deploying to production!
