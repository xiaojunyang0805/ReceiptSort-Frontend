# PDF Invoice Parsing Fix Plan - ReceiptSort

## Executive Summary

**Current Status**: PDF invoices fail to process with HTTP 405 error  
**Root Cause**: Not a parsing issue, but a Vercel routing/deployment issue  
**Impact**: Critical - Users cannot process PDF receipts (Chinese invoices especially)  
**Time to Fix**: 2-4 hours  
**Priority**: ðŸ"´ CRITICAL - Must fix before launch

---

## Problem Analysis

### What's Actually Happening

The document analysis reveals **TWO SEPARATE ISSUES**:

#### Issue #1: HTTP 405 Error (CRITICAL - Blocking all PDF processing)
- **Symptom**: POST requests to `/api/receipts/[id]/process` fail instantly with 405
- **Root Cause**: Vercel routing configuration not recognizing dynamic routes
- **Impact**: NO PDFs can be processed at all
- **Evidence**: 
  - Error occurs in <2 seconds (not a timeout)
  - Routes work locally but fail on Vercel
  - Server-side logs never execute (route handler not reached)
  - Other static API routes work fine

#### Issue #2: Chinese Character Encoding (SECONDARY - Will surface after Issue #1 is fixed)
- **Symptom**: Chinese characters appear as garbled text when extracted
- **Root Cause**: PDF uses advanced encoding `/UniGB-UCS2-H` not supported by PyPDF2
- **Impact**: Extracted data will be incorrect for Chinese invoices
- **Evidence**: 
  - Warning: "Advanced encoding /UniGB-UCS2-H not implemented"
  - Text extraction shows: `Vý[¶z\u000eR¡` instead of readable Chinese
  - This is a COMMON issue with Chinese PDFs

---

## Fix Strategy

### Phase 1: Fix the 405 Routing Error (Do This FIRST)
**Estimated Time**: 1-2 hours  
**Priority**: CRITICAL

### Phase 2: Fix Chinese Character Encoding  
**Estimated Time**: 1-2 hours  
**Priority**: HIGH (but only matters after Phase 1 is done)

---

## PHASE 1: Fix Vercel Routing (MUST DO FIRST)

### Root Cause Analysis

The 405 error means Vercel isn't recognizing the dynamic route structure. This is a known issue with:
- Next.js 14 App Router
- Dynamic route segments `[id]`
- Vercel's edge deployment
- POST method handlers

### Solution Options (Try in Order)

#### Option 1: Fix Route Export Configuration ⭐ **TRY THIS FIRST**

**Problem**: Next.js 14 requires specific route segment config for POST handlers

**Fix**:
```typescript
// src/app/api/receipts/[id]/process/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ADD THESE EXPORTS (critical for Vercel)
export const runtime = 'nodejs';  // Force Node.js runtime (not Edge)
export const dynamic = 'force-dynamic';  // Disable static optimization
export const revalidate = 0;  // No caching

// Your existing POST function
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Your existing code...
}
```

**Apply to BOTH files**:
- `src/app/api/receipts/[id]/process/route.ts`
- `src/app/api/receipts/[id]/retry/route.ts`

**Test**: Deploy and test immediately

---

#### Option 2: Restructure Route Files (If Option 1 Fails)

**Problem**: Vercel might not recognize the current route structure

**Current Structure** (Not Working):
```
src/app/api/receipts/[id]/
├── process/
│   └── route.ts    ← POST handler here
└── retry/
    └── route.ts    ← POST handler here
```

**New Structure** (More Reliable):
```
src/app/api/receipts/
├── [id].ts         ← Handle GET/DELETE for single receipt
└── [id]/
    └── action/
        └── route.ts  ← POST handler with ?action=process or ?action=retry
```

**Implementation**:

```typescript
// src/app/api/receipts/[id]/action/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action'); // 'process' or 'retry'
  
  const receiptId = params.id;
  
  if (action === 'process') {
    // Your process logic
  } else if (action === 'retry') {
    // Your retry logic
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
```

**Update Frontend**:
```typescript
// Change from:
fetch(`/api/receipts/${id}/process`, { method: 'POST' })

// To:
fetch(`/api/receipts/${id}/action?action=process`, { method: 'POST' })
```

---

#### Option 3: Use Catch-All Routes (Nuclear Option)

**Problem**: Dynamic segments with nested routes are unreliable on Vercel

**Implementation**:
```
src/app/api/receipts/
└── [...slug]/
    └── route.ts    ← Handles all /api/receipts/* requests
```

```typescript
// src/app/api/receipts/[...slug]/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const [id, action] = params.slug;  // ['abc123', 'process'] or ['abc123', 'retry']
  
  if (action === 'process') {
    // Process logic
  } else if (action === 'retry') {
    // Retry logic
  }
}
```

---

#### Option 4: Move to Edge Runtime (If Node.js is the Problem)

**Problem**: Node.js runtime might not work with dynamic routes on Vercel Free tier

**Fix**:
```typescript
export const runtime = 'edge';  // Instead of 'nodejs'
export const dynamic = 'force-dynamic';

// Note: Edge runtime has limitations:
// - No Node.js modules (fs, child_process, etc.)
// - Max execution time: 30 seconds (vs 10s for Node)
// - But better routing support
```

**Requires Changes**:
- Cannot use `pdf-lib` or other Node.js PDF libraries
- Must use web-compatible libraries only
- OpenAI API calls still work (fetch API)

---

#### Option 5: Vercel Configuration File

**Problem**: Missing vercel.json configuration for API routes

**Fix**: Create/update `vercel.json` in project root:

```json
{
  "functions": {
    "src/app/api/receipts/[id]/process/route.ts": {
      "maxDuration": 60,
      "memory": 1024,
      "runtime": "nodejs20.x"
    },
    "src/app/api/receipts/[id]/retry/route.ts": {
      "maxDuration": 60,
      "memory": 1024,
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/receipts/:id/process",
      "destination": "/api/receipts/[id]/process"
    },
    {
      "source": "/api/receipts/:id/retry",
      "destination": "/api/receipts/[id]/retry"
    }
  ]
}
```

---

### Debugging Steps for Phase 1

1. **Enable Vercel Function Logs**:
```bash
vercel logs <deployment-url> --follow
```

2. **Check Vercel Functions Dashboard**:
- Go to Vercel Dashboard → Your Project → Functions
- Verify functions exist for these routes
- Check if they show as Node.js or Edge

3. **Test Direct Deployment URL** (bypass custom domain):
```bash
# Instead of receiptsort.seenano.nl
# Use: receiptsort-xxx.vercel.app/api/receipts/{id}/process
```

4. **Check Build Output**:
```bash
vercel build --debug
```
- Look for route generation warnings
- Verify `.vercel/output/functions/` structure

5. **Test with curl**:
```bash
curl -X POST \
  https://receiptsort.seenano.nl/api/receipts/test-id/process \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v  # Verbose output
```

---

## PHASE 2: Fix Chinese Character Encoding

**⚠️ Only start this AFTER Phase 1 is fixed and PDFs can be processed**

### Problem Details

The Chinese invoice uses:
- Language: Simplified Chinese (电子发票)
- Encoding: UniGB-UCS2-H (GB18030)
- PDF Generator: macOS Quartz PDFContext + OpenPDF 1.3.30

**Current Extraction Result** (Garbled):
```
Vý[¶z\u000eR¡`;\\@Qh
```

**Expected Extraction** (From visible content):
```
发票号码: 25332000000398124894
开票日期: 2025年09月10日
购买方: 上海汀上智能科技有限公司
销售方: 杭州汉盛酒店管理有限公司
金额: ¥188.12
税额: ¥1.88
价税合计: ¥190.00
项目: *住宿服务*住宿费
```

### Solution Strategy

#### Option A: Switch to OCR-Based Extraction ⭐ **RECOMMENDED**

**Why**: Chinese PDFs are notoriously difficult to parse with text extraction

**Implementation**:

1. **Use OpenAI Vision API** (Already in your stack):
```typescript
// lib/pdf-converter.ts

async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  // Your existing PDF → Image conversion
  // But ensure HIGH quality for Chinese characters
  const canvas = await page.render({
    canvasFactory,
    viewport,
    intent: 'print',  // Better quality than 'display'
  }).promise;
  
  return canvas.toBuffer('image/png', {
    compressionLevel: 3,  // Higher quality (vs 6-9)
    filters: canvas.PNG_FILTER_NONE,
  });
}
```

2. **Optimize OpenAI Prompt for Chinese Receipts**:
```typescript
// lib/openai.ts

const systemPrompt = `
You are an expert at extracting data from Chinese and English receipts/invoices.

CRITICAL FOR CHINESE INVOICES (电子发票):
- Look for "发票号码" (Invoice Number) - usually 20+ digits
- Look for "开票日期" (Invoice Date) - format: YYYY年MM月DD日
- Look for "名称" (Name/Merchant) under "销售方信息" (Seller Info)
- Look for "价税合计" (Total Amount) - this is the grand total
- Look for "金额" (Amount before tax) and "税额" (Tax Amount)
- Look for "统一社会信用代码" (Unified Social Credit Code) - 18 characters

Common Chinese invoice categories:
- 住宿服务 → Travel (Accommodation)
- 餐饮服务 → Food & Dining
- 交通运输 → Transportation
- 办公用品 → Office Supplies

Return JSON in this format:
{
  "merchant_name": "Company name in Chinese or English",
  "amount": 188.12,
  "currency": "CNY",  // or USD, EUR
  "receipt_date": "2025-09-10",
  "category": "Travel",
  "tax_amount": 1.88,
  "invoice_number": "25332000000398124894",
  "confidence_score": 0.95
}
`;
```

3. **Improve Image Quality for OCR**:
```typescript
// Current issue: Low quality images = poor Chinese character recognition

// lib/pdf-converter.ts
const OPTIMAL_SETTINGS_FOR_CHINESE = {
  scale: 2.0,              // Higher resolution (was 0.5-0.8)
  jpegQuality: 0.95,        // Higher quality (was 0.6-0.75)
  maxDimension: 2400,       // Larger images (was 1000-1400)
};

// Why this matters:
// - Chinese characters have more strokes
// - Low resolution makes 发票 look like 发栗
// - OpenAI Vision needs clear text to recognize
```

---

#### Option B: Use pdfplumber with Better CJK Support

**Why**: pdfplumber handles Chinese better than PyPDF2

**Install**:
```bash
pip install pdfplumber --break-system-packages
```

**Implementation**:
```python
import pdfplumber

def extract_chinese_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[0]
        
        # Extract text with better Chinese support
        text = page.extract_text(
            x_tolerance=3,      # Merge chars closer than 3 pixels
            y_tolerance=3,
            layout=True,        # Preserve layout
            x_density=7.25,     # Higher density for Chinese
            y_density=13
        )
        
        # Extract tables (Chinese invoices are often tabular)
        tables = page.extract_tables()
        
        return text, tables
```

**Pros**:
- Better Chinese character support
- Can extract tables directly
- Preserves layout

**Cons**:
- Still may struggle with complex encodings
- Requires Python (can't run in Edge runtime)

---

#### Option C: Hybrid Approach (BEST FOR PRODUCTION)

**Strategy**: Try text extraction first, fall back to OCR

```typescript
async function extractReceiptData(fileUrl: string, fileType: string) {
  if (fileType === 'pdf') {
    // Step 1: Try text extraction (fast, cheap)
    const extractedText = await extractPdfText(fileUrl);
    
    // Step 2: Check if text is garbled (Chinese encoding issue)
    const hasGarbledText = /[\x00-\x1F\x7F-\x9F]{3,}/.test(extractedText);
    
    if (hasGarbledText || extractedText.length < 50) {
      console.log('Text extraction failed, using OCR...');
      
      // Step 3: Fall back to OCR via OpenAI Vision
      const imageBuffer = await convertPdfToImage(fileUrl);
      return await extractViaOCR(imageBuffer);
    }
    
    // Step 4: Text extraction worked, use it
    return await parseExtractedText(extractedText);
  }
  
  // For images, always use OCR
  return await extractViaOCR(fileUrl);
}
```

---

### Testing Chinese PDFs

**Test Data Needed**:
1. ✅ Chinese e-invoice (电子发票) - You have this
2. ⬜ Chinese paper receipt scan
3. ⬜ Mixed Chinese/English receipt
4. ⬜ Traditional Chinese (Taiwan/Hong Kong)

**Accuracy Targets**:
- Invoice Number: 100% (critical for accounting)
- Date: 100% (critical)
- Amount: 100% (critical)
- Merchant Name: 90%+ (some variance OK)
- Category: 70%+ (can be manually corrected)

**Test Script**:
```bash
# Upload Chinese PDF
# Process with new OCR
# Check extracted data:
# - ✅ Invoice: 25332000000398124894
# - ✅ Date: 2025-09-10
# - ✅ Amount: 188.12
# - ✅ Tax: 1.88
# - ✅ Total: 190.00
# - ✅ Merchant: 杭州汉盛酒店管理有限公司
```

---

## Implementation Checklist

### Phase 1: Fix 405 Routing Error

- [ ] **Option 1**: Add route segment config
  - [ ] Update `process/route.ts` with exports
  - [ ] Update `retry/route.ts` with exports
  - [ ] Deploy to Vercel
  - [ ] Test POST request
  - [ ] ✅ If works, move to Phase 2
  - [ ] ❌ If fails, try Option 2

- [ ] **Option 2**: Restructure to `/action` route
  - [ ] Create new route structure
  - [ ] Update frontend API calls
  - [ ] Deploy and test
  - [ ] ✅ If works, move to Phase 2
  - [ ] ❌ If fails, try Option 3

- [ ] **Option 3**: Use catch-all routes
  - [ ] Create `[...slug]/route.ts`
  - [ ] Update frontend API calls
  - [ ] Deploy and test
  - [ ] ✅ If works, move to Phase 2

- [ ] **Debug if all fail**:
  - [ ] Check Vercel function logs
  - [ ] Verify build output
  - [ ] Test direct deployment URL
  - [ ] Check Vercel dashboard functions
  - [ ] Open support ticket with Vercel

### Phase 2: Fix Chinese Character Encoding

- [ ] **Improve PDF to Image Conversion**:
  - [ ] Increase scale to 2.0x
  - [ ] Increase JPEG quality to 0.95
  - [ ] Increase max dimension to 2400px
  - [ ] Test with Chinese PDF

- [ ] **Update OpenAI Prompt**:
  - [ ] Add Chinese invoice patterns
  - [ ] Add field name translations
  - [ ] Add examples for Chinese receipts
  - [ ] Test extraction accuracy

- [ ] **Add Encoding Detection**:
  - [ ] Detect garbled text
  - [ ] Log encoding issues
  - [ ] Auto-fallback to OCR
  - [ ] Track success rate

- [ ] **Testing**:
  - [ ] Upload Chinese invoice
  - [ ] Process and verify all fields
  - [ ] Check accuracy ≥90%
  - [ ] Test with 5+ different Chinese receipts

---

## Expected Timeline

### Optimistic (4 hours total)
- Phase 1: 1 hour (Option 1 works immediately)
- Phase 2: 2 hours (OCR quality tuning)
- Testing: 1 hour

### Realistic (6 hours total)
- Phase 1: 2 hours (Need to try Options 1-2)
- Phase 2: 3 hours (Multiple prompt iterations)
- Testing: 1 hour

### Pessimistic (8+ hours)
- Phase 1: 3-4 hours (Need Option 3 or debugging)
- Phase 2: 3-4 hours (Chinese encoding challenges)
- Testing: 1 hour

---

## Success Criteria

### Phase 1 Complete When:
- [ ] POST `/api/receipts/{id}/process` returns 200 (not 405)
- [ ] Server-side logs appear in Vercel
- [ ] Processing starts (even if extraction fails)
- [ ] Credits are deducted
- [ ] Status updates to 'processing' then 'completed'

### Phase 2 Complete When:
- [ ] Chinese invoice fields extracted correctly:
  - [ ] Invoice number: 25332000000398124894 ✓
  - [ ] Date: 2025-09-10 ✓
  - [ ] Merchant: 杭州汉盛酒店管理有限公司 ✓
  - [ ] Amount: 188.12 ✓
  - [ ] Tax: 1.88 ✓
  - [ ] Total: 190.00 ✓
- [ ] Confidence score >0.85
- [ ] No garbled characters in extracted data
- [ ] Export to Excel shows Chinese characters correctly

---

## Risk Mitigation

### If Phase 1 Takes Too Long (>4 hours)
**Workaround**: Disable PDF support temporarily
```typescript
// In ReceiptUpload.tsx
const acceptedTypes = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  // 'application/pdf': ['.pdf'],  // Temporarily disabled
};

// Show message: "PDF support coming soon. Please upload images for now."
```

### If Phase 2 Accuracy is Low (<80%)
**Workaround**: Manual correction mode
```typescript
// Show low confidence warning
if (confidence_score < 0.7) {
  toast.warning(
    "Low confidence extraction. Please verify all fields carefully."
  );
}

// Pre-populate form but make all fields editable
// User can correct mistakes
```

---

## Post-Fix Validation

### Test Cases

1. **Test Case 1: This Specific Chinese Invoice**
   - File: `1760581209670-wkq633.pdf`
   - Expected: All fields extracted correctly
   - Status: ⬜ Pending

2. **Test Case 2: Regular English Receipt**
   - File: Any clear English receipt
   - Expected: Already working, should still work
   - Status: ⬜ Pending

3. **Test Case 3: Poor Quality PDF**
   - File: Scanned receipt (low resolution)
   - Expected: Lower confidence but still extracts
   - Status: ⬜ Pending

4. **Test Case 4: Multi-page PDF**
   - File: 2+ page invoice
   - Expected: Extracts from page 1 only
   - Status: ⬜ Pending

5. **Test Case 5: Edge Runtime Test**
   - Upload during high load
   - Expected: No timeouts, completes <30s
   - Status: ⬜ Pending

---

## Monitoring After Fix

### Metrics to Track

1. **Processing Success Rate**
   - Target: >95%
   - Alert if: <90%

2. **Average Processing Time**
   - Target: <20 seconds for images, <30 seconds for PDFs
   - Alert if: >45 seconds

3. **Confidence Score Distribution**
   - Target: 80% of receipts >0.8 confidence
   - Alert if: >20% receipts <0.7 confidence

4. **PDF vs Image Success Rate**
   - Track separately
   - If PDF <80% → recommend users upload images

### Error Logging

```typescript
// Add comprehensive logging
console.log('[PDF Processing]', {
  receiptId,
  fileType: 'pdf',
  fileSize: file.size,
  encoding: detectedEncoding,
  useOCR: usedOCRFallback,
  extractionTime: Date.now() - startTime,
  confidence: result.confidence_score,
  language: detectedLanguage, // 'zh', 'en', etc.
});
```

---

## Documentation Updates

After fix is complete, update:

1. **User-Facing**:
   - ✅ PDF support confirmed working
   - ✅ Chinese invoices supported
   - ⚠️ Known issues: Traditional Chinese may have lower accuracy

2. **Developer Docs**:
   - Document the encoding issue
   - Document the Vercel routing solution
   - Add troubleshooting guide

3. **Support FAQs**:
   - Q: Why is my Chinese invoice not processing?
   - A: We support Simplified Chinese e-invoices. If extraction fails, you can manually correct the data.

---

## Conclusion

**Priority Order**:
1. ðŸ"´ **CRITICAL**: Fix Phase 1 (405 error) - Without this, NO PDFs work
2. 🟡 **HIGH**: Fix Phase 2 (Chinese encoding) - After Phase 1 works
3. 🟢 **MEDIUM**: Add monitoring and validation

**Estimated Total Time**: 4-8 hours

**Next Steps**:
1. Start with Phase 1, Option 1 (quickest to try)
2. If Option 1 fails within 30 min, move to Option 2
3. Once Phase 1 works, immediately test with this Chinese PDF
4. Tune Phase 2 settings until accuracy >90%
5. Deploy and monitor first 50 PDF uploads

**Launch Impact**:
- ⚠️ **Must fix Phase 1 before launch** - blocking issue
- ℹ️ Phase 2 can be iterated post-launch if needed
- Consider soft-launching to Chinese market after Phase 2 is solid

---

## Quick Reference Commands

```bash
# Test the route locally
curl -X POST http://localhost:3000/api/receipts/test/process \
  -H "Content-Type: application/json" \
  -d '{}'

# Deploy to Vercel
git add .
git commit -m "fix: resolve PDF processing 405 error"
git push origin main

# Check Vercel logs
vercel logs --follow

# Test on production
curl -X POST https://receiptsort.seenano.nl/api/receipts/test-id/process \
  -H "Content-Type: application/json" \
  -v
```

---

**Good luck! You're fixing a solvable problem. Phase 1 is purely configuration, Phase 2 is fine-tuning. Both are achievable before launch. 🚀**
