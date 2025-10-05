# Edge Cases Handling - Receipt Processing

## Overview
This document outlines all edge cases handled in the receipt processing system.

## 1. Retry Failed Extractions

### API Endpoint: `/api/receipts/[id]/retry`
- **Method**: POST
- **Purpose**: Retry processing failed receipts without deducting credits
- **When to use**:
  - Receipt status is 'failed'
  - Receipt has low confidence (< 0.7)
  - Temporary OpenAI API issues

### Features:
- ✅ No credit deduction on retry
- ✅ Validates receipt ownership
- ✅ Only allows retry for failed/low-confidence receipts
- ✅ Updates status to 'processing' during retry
- ✅ Returns detailed error messages

### Error Codes:
- `401`: Unauthorized (not logged in)
- `404`: Receipt not found or not owned by user
- `400`: Receipt cannot be retried (already processed successfully with high confidence)
- `500`: Processing failed (retryable)

---

## 2. Error Display in UI

### Receipt Detail Modal - Failed Status
When a receipt fails processing:
- 🚨 **Red alert** displays the error message
- 🔄 **Retry button** allows immediate reprocessing
- 📝 Error details are shown to help debug issues

### Low Confidence Warning
When confidence score < 0.7:
- ⚠️ **Yellow alert** warns about low confidence
- 📊 Shows exact confidence percentage
- 💡 Advises manual verification of all fields
- 📝 Displays validation warnings if any

---

## 3. Data Validation

### Validation Rules:

#### Amount Validation:
- ✅ Must be positive (> 0)
- ⚠️ Warning if amount > $1,000,000

#### Currency Validation:
- ✅ Supported: USD, EUR, GBP, CHF, CAD, AUD, JPY
- ⚠️ Warning for unsupported currencies

#### Date Validation:
- ❌ Cannot be in the future
- ⚠️ Warning if more than 10 years old
- ✅ Accepts null dates (when not found on receipt)

### Behavior:
- Validation errors **lower confidence to 0.6** (max)
- Errors are stored in `processing_error` field
- Receipt still marked as 'completed' (not failed)
- User can manually correct and save

---

## 4. PDF Receipt Support

### Native Support:
- ✅ **OpenAI gpt-4o** supports PDF files natively
- ✅ Upload component accepts PDFs (max 10MB)
- ✅ Same extraction process as images
- ✅ First page is analyzed for receipt data

### Supported Formats:
- 📄 **Images**: PNG, JPG, JPEG, WebP
- 📄 **Documents**: PDF

### File Size Limits:
- Max: **10MB per file**
- Enforced in upload component
- Rejected files show toast error

---

## 5. Receipt Date Handling

### Enhanced Date Logic:
- ✅ Accepts null dates (stored as-is)
- ✅ Parses various formats: "3/15/12" → "2012-03-15"
- ✅ 2-digit year logic:
  - 00-25 → 2000-2025
  - 26-99 → 1926-1999
- ✅ Never defaults to "today" if date not found
- ✅ TypeScript type allows `string | null`

### Updated Schema:
```typescript
receipt_date: string | null  // Previously was string (required)
```

---

## 6. Multi-Receipt Detection

**Status**: 🔄 Future Enhancement

Planned features:
- Detect multiple receipts in one image
- Process primary/largest receipt
- Show warning: "Multiple receipts detected"
- Allow user to re-upload separate images

---

## 7. Error Recovery Flow

### User Experience:
1. **Upload** → Receipt created with status='pending'
2. **Process** → Status='processing', deduct 1 credit
3. **If successful** → Status='completed', show data
4. **If failed** → Status='failed', show error + Retry button
5. **Retry** → Status='processing' again, **NO credit deduction**
6. **Success** → Status='completed', data extracted
7. **Still failed** → User can retry unlimited times

### Credit Policy:
- ✅ Credit deducted **only on first process attempt**
- ✅ Retries are **always free**
- ✅ Failed receipts **don't consume credits**

---

## 8. Low Confidence Handling

### Scenarios Triggering Low Confidence:

1. **Generic Merchant Names**:
   - "SUPERMARKET", "Restaurant Name" → confidence = 0.7

2. **Validation Errors**:
   - Any validation error → confidence ≤ 0.6

3. **Poor Image Quality**:
   - AI detects unclear text → confidence = 0.5-0.85

4. **Missing Date**:
   - No date on receipt → date = null, confidence may be lowered

### User Actions:
- ✅ View warning in detail modal
- ✅ Manually edit all fields
- ✅ Save corrected data
- ✅ Retry processing if needed

---

## 9. Security & Validation

### Access Control:
- ✅ User can only retry **own receipts**
- ✅ Signed URLs expire after 5 minutes
- ✅ RLS policies enforce ownership

### Input Validation:
- ✅ File type validation (upload)
- ✅ File size validation (max 10MB)
- ✅ Data format validation (API)
- ✅ Ownership validation (all endpoints)

---

## 10. Testing Edge Cases

### Test Scenarios:
1. ✅ Upload PDF receipt → Should process successfully
2. ✅ Process receipt with no date → Should return null date
3. ✅ Process old receipt (>10 years) → Should show warning
4. ✅ Process future-dated receipt → Should fail validation
5. ✅ Process high-amount receipt ($1M+) → Should show warning
6. ✅ Retry failed receipt → Should process without credit deduction
7. ✅ View low-confidence receipt → Should show warning
8. ✅ Generic merchant name → Should lower confidence

### Manual Testing:
```bash
# Test retry endpoint
curl -X POST http://localhost:3000/api/receipts/{id}/retry \
  -H "Authorization: Bearer {token}"

# Expected responses:
# - 401: Not authenticated
# - 404: Receipt not found
# - 400: Cannot retry (already successful)
# - 200: Retry successful
```

---

## Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| Retry API | ✅ Complete | `/api/receipts/[id]/retry/route.ts` |
| Error UI | ✅ Complete | `ReceiptDetailModal.tsx` |
| Data Validation | ✅ Complete | `process/route.ts`, `retry/route.ts` |
| PDF Support | ✅ Complete | `openai.ts` (native gpt-4o support) |
| Null Date Handling | ✅ Complete | `types/receipt.ts`, `openai.ts` |
| Low Confidence Warning | ✅ Complete | `ReceiptDetailModal.tsx` |
| Multi-Receipt Detection | 🔄 Future | TBD |

---

## Files Modified

### API Routes:
1. `src/app/api/receipts/[id]/retry/route.ts` - **NEW**
2. `src/app/api/receipts/[id]/process/route.ts` - Added validation

### Components:
1. `src/components/dashboard/ReceiptDetailModal.tsx` - Added error handling, retry button, warnings

### Types:
1. `src/types/receipt.ts` - Changed `receipt_date` to `string | null`

### Libraries:
1. `src/lib/openai.ts` - Updated docs for PDF support, null date handling

---

## Future Enhancements

1. **Batch Retry**: Retry all failed receipts at once
2. **Auto-Retry**: Automatically retry on temporary API errors
3. **Receipt Splitting**: Handle multiple receipts in one image
4. **OCR Fallback**: Use alternative OCR if OpenAI fails
5. **Human Review Queue**: Flag low-confidence receipts for manual review
6. **Smart Validation**: Learn from user corrections
