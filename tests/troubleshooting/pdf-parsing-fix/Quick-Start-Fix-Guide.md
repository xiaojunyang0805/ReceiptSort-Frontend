# PDF Fix Quick-Start Guide - Do This Now

## ⚡ Immediate Action Items

### STEP 1: Fix the 405 Error (15 minutes)

**Option A: Update Route Configuration** ⭐ Try This First

1. **Open** `src/app/api/receipts/[id]/process/route.ts`

2. **Add these three lines at the top** (right after imports):

```typescript
// ADD THESE THREE LINES:
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Your file should start like this:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ADD THESE THREE LINES:
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... rest of your code
}
```

3. **Do the same for** `src/app/api/receipts/[id]/retry/route.ts`

4. **Deploy**:
```bash
git add .
git commit -m "fix: add route segment config for Vercel"
git push origin main
```

5. **Wait 2 minutes** for deployment

6. **Test**:
   - Go to your app
   - Upload the Chinese PDF
   - Click "处理" (Process)
   - **Does it work?** ✅ Move to Step 2 | ❌ Try Option B

---

**Option B: If Option A Fails** (30 minutes)

**Restructure the routes to use query parameters instead of nested paths**

1. **Create new file** `src/app/api/receipts/[id]/action/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (!action || !['process', 'retry'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "process" or "retry"' },
        { status: 400 }
      );
    }

    const receiptId = params.id;
    
    // Your existing authentication logic here
    // ...

    if (action === 'process') {
      // Copy your process logic from process/route.ts
      // ...
    } else if (action === 'retry') {
      // Copy your retry logic from retry/route.ts
      // ...
    }

  } catch (error) {
    console.error('[Receipt Action Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

2. **Update Frontend** - Find where you call the API:

In `ReceiptList.tsx` or wherever you have:
```typescript
// OLD:
const response = await fetch(`/api/receipts/${id}/process`, {
  method: 'POST',
});

// NEW:
const response = await fetch(`/api/receipts/${id}/action?action=process`, {
  method: 'POST',
});
```

And for retry:
```typescript
// OLD:
const response = await fetch(`/api/receipts/${id}/retry`, {
  method: 'POST',
});

// NEW:
const response = await fetch(`/api/receipts/${id}/action?action=retry`, {
  method: 'POST',
});
```

3. **Deploy and test**

---

### STEP 2: Fix Chinese Character Extraction (30 minutes)

**Once PDFs are processing (not getting 405), do this:**

1. **Increase Image Quality** in `src/lib/pdf-converter.ts`:

```typescript
// FIND these lines and CHANGE values:

// OLD:
const scale = 0.5;                    // or 0.8
const jpegQuality = 0.6;              // or 0.75
const MAX_DIMENSION = 1000;           // or 1400

// NEW:
const scale = 2.0;                    // DOUBLE the resolution
const jpegQuality = 0.95;             // HIGH quality for Chinese chars
const MAX_DIMENSION = 2400;           // LARGER images
```

Full context:
```typescript
async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  // ... existing code ...
  
  const scale = 2.0;  // ← CHANGE THIS
  const viewport = page.getViewport({ scale });
  
  const canvas = await page.render({
    canvasFactory,
    viewport,
    intent: 'print',  // ← KEEP THIS (better quality)
  }).promise;
  
  return canvas.toBuffer('image/png', {
    compressionLevel: 3,  // ← CHANGE THIS (was 6-9)
    quality: 0.95,        // ← CHANGE THIS
  });
}
```

2. **Update OpenAI Prompt** in `src/lib/openai.ts`:

```typescript
const systemPrompt = `
You are an expert at extracting data from receipts and invoices in ANY language.

CRITICAL INSTRUCTIONS:

For CHINESE INVOICES (电子发票):
- "发票号码" = Invoice Number (usually 20+ digits)
- "开票日期" = Invoice Date (format: YYYY年MM月DD日 → convert to YYYY-MM-DD)
- "销售方" or "销售方信息" = Seller/Merchant (under this section)
- "名称" = Company Name (look for this under seller info)
- "价税合计" = Grand Total (THE most important amount)
- "金额" = Amount before tax
- "税额" = Tax amount
- "统一社会信用代码" = Tax ID (18 characters, starts with 91 or 92)

COMMON CHINESE CATEGORIES:
- 住宿服务 / 住宿费 → Travel (hotel/accommodation)
- 餐饮服务 → Food & Dining
- 交通运输 → Transportation
- 办公用品 → Office Supplies
- 咨询服务 → Professional Services

EXTRACTION RULES:
1. Amount must be "价税合计" (grand total), NOT "金额" (subtotal)
2. Extract invoice_number if visible (this is critical for Chinese invoices)
3. Date format: Always convert to YYYY-MM-DD (e.g., 2025年09月10日 → 2025-09-10)
4. Currency: CNY for ¥ symbol, USD for $, EUR for €
5. If you see Chinese text, the currency is likely CNY
6. Confidence: 1.0 if all major fields clear, 0.8-0.9 if some uncertainty, <0.7 if poor quality

Return ONLY valid JSON:
{
  "merchant_name": "Company name (keep in original language)",
  "amount": 190.00,
  "currency": "CNY",
  "receipt_date": "2025-09-10",
  "category": "Travel",
  "tax_amount": 1.88,
  "invoice_number": "25332000000398124894",
  "payment_method": "Credit Card",
  "confidence_score": 0.95,
  "raw_text": "Full OCR text here"
}

If ANY field is unclear, use null but ALWAYS return valid JSON.
`;
```

3. **Test with Chinese PDF**:
   - Upload `1760581209670-wkq633.pdf`
   - Process it
   - Check extracted data:
     - ✅ Invoice: 25332000000398124894
     - ✅ Date: 2025-09-10
     - ✅ Merchant: 杭州汉盛酒店管理有限公司
     - ✅ Amount: 190.00
     - ✅ Tax: 1.88

4. **If accuracy is still low** (<80%), try:
   - Increase scale to 2.5 or 3.0
   - Use PNG instead of JPEG (no compression loss)
   - Check OpenAI Dashboard for rate limits

---

### STEP 3: Add Fallback Logic (15 minutes)

**Prevent future Chinese PDF issues:**

In `src/lib/openai.ts` or your processing logic:

```typescript
async function extractReceiptData(imageUrl: string): Promise<ExtractedData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt  // The updated prompt from Step 2
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"  // ← IMPORTANT: Use "high" for Chinese text
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1,  // Low temperature = more consistent
    });

    const content = response.choices[0].message.content;
    const data = JSON.parse(content);

    // DETECT GARBLED TEXT (likely encoding issue)
    const hasGarbledText = /[\x00-\x1F\x7F-\x9F]{5,}/.test(data.merchant_name || '');
    
    if (hasGarbledText) {
      console.warn('[Garbled Text Detected]', data.merchant_name);
      // Log for monitoring
      // In future, could retry with different settings
    }

    return data;

  } catch (error) {
    console.error('[OpenAI Extraction Error]', error);
    throw error;
  }
}
```

---

## Quick Test Script

**Run this after each change to validate:**

```bash
# 1. Test the API endpoint directly
curl -X POST https://receiptsort.seenano.nl/api/receipts/test-id/action?action=process \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v

# Expected: 
# - Status 200 or 401 (auth error) ✅
# - NOT 405 ❌

# 2. Check Vercel logs
vercel logs --follow

# 3. Upload and process Chinese PDF in UI
# - Should complete in 20-30 seconds
# - Check accuracy of extracted fields
```

---

## Success Checklist

### Phase 1: 405 Fixed
- [ ] POST request returns 200/401 (not 405)
- [ ] Can see "Processing..." indicator
- [ ] Status changes to "processing" → "completed"
- [ ] Server logs appear in Vercel
- [ ] Credit is deducted

### Phase 2: Chinese Extraction Works
- [ ] Invoice number extracted: 25332000000398124894
- [ ] Date extracted: 2025-09-10
- [ ] Merchant extracted (in Chinese): 杭州汉盛酒店管理有限公司
- [ ] Amount correct: 190.00 (not 188.12)
- [ ] Tax amount: 1.88
- [ ] Category assigned: Travel or similar
- [ ] No garbled characters (no: `Vý[¶z\u000eR¡`)
- [ ] Confidence score >0.8

---

## If Things Go Wrong

### Problem: Still getting 405 after Option A
**Solution**: Try Option B (restructure routes)

### Problem: Option B also fails
**Solution**: 
1. Check Vercel Functions dashboard - are functions created?
2. Try testing on direct deployment URL (not custom domain)
3. Create vercel.json with explicit rewrites (see full plan)
4. Consider catch-all route `[...slug]` (see full plan)

### Problem: PDF processes but data is still garbled
**Solution**:
1. Check image quality: Download the converted image and verify Chinese chars are visible
2. If image is blurry → increase scale to 2.5 or 3.0
3. If image is clear → improve OpenAI prompt with more examples
4. Test with OpenAI Playground directly to isolate issue

### Problem: Processing is too slow (>60 seconds)
**Solution**:
1. Check Vercel function timeout settings
2. Reduce image size (but keep quality high enough for Chinese)
3. Consider using Edge runtime instead of Node.js
4. Optimize PDF → Image conversion

### Problem: Running out of OpenAI credits
**Solution**:
1. Set up billing alerts in OpenAI dashboard
2. Add usage monitoring to track per-receipt cost
3. Consider caching results for retries
4. Add rate limiting for processing

---

## Monitoring After Fix

**Add this logging to track success:**

```typescript
console.log('[PDF Processing Stats]', {
  receiptId,
  fileSize: Math.round(file.size / 1024) + 'KB',
  processingTime: (Date.now() - startTime) + 'ms',
  confidence: result.confidence_score,
  hasChineseChars: /[\u4e00-\u9fa5]/.test(result.merchant_name),
  success: result.confidence_score > 0.7
});
```

**Track these metrics:**
- Average confidence score (target: >0.85)
- Processing time (target: <25 seconds)
- Success rate (target: >90%)
- Chinese PDF success rate separately

---

## Expected Results

### Before Fix:
- ❌ POST returns 405 Error
- ❌ No processing happens
- ❌ Chinese text is garbled

### After Step 1:
- ✅ POST returns 200
- ✅ Processing starts
- ⚠️ Chinese text might still be garbled

### After Step 2:
- ✅ POST returns 200
- ✅ Processing completes
- ✅ Chinese text extracted correctly
- ✅ Accuracy >90%

---

## Time Investment

- **Step 1 (Option A)**: 15 minutes
- **Step 1 (Option B if needed)**: 30 minutes
- **Step 2**: 30 minutes
- **Step 3**: 15 minutes
- **Testing**: 20 minutes
- **Total**: 1-2 hours

---

## Launch Decision

### Can Launch If:
- ✅ Step 1 complete (405 fixed)
- ⚠️ Step 2 can be iterated post-launch
- ✅ English receipts work perfectly
- ⚠️ Chinese receipts have "manual correction" fallback

### Must Fix Before Launch:
- ❌ Step 1 (405 error) - blocking all PDFs

### Can Fix After Launch:
- ⚠️ Step 2 (Chinese accuracy) - if >70% accurate with manual correction option

---

**Ready to start? Begin with Step 1, Option A. Takes 15 minutes. Go! 🚀**
