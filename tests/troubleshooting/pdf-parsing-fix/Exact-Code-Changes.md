# Exact Code Changes Required

## File 1: src/app/api/receipts/[id]/process/route.ts

### CHANGE: Add these 3 lines at the top (after imports)

```typescript
// BEFORE (your current file):
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// ... other imports ...

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... your code ...
}

// AFTER (add these 3 lines):
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// ... other imports ...

// 👇 ADD THESE THREE LINES
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// 👆 END OF ADDITION

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... your code stays the same ...
}
```

---

## File 2: src/app/api/receipts/[id]/retry/route.ts

### CHANGE: Same addition - add 3 lines after imports

```typescript
// BEFORE:
import { NextRequest, NextResponse } from 'next/server';
// ... other imports ...

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... your code ...
}

// AFTER:
import { NextRequest, NextResponse } from 'next/server';
// ... other imports ...

// 👇 ADD THESE THREE LINES
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// 👆 END OF ADDITION

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ... your code stays the same ...
}
```

---

## File 3: src/lib/pdf-converter.ts

### CHANGE 1: Update quality settings

Find the section where you define quality settings and change:

```typescript
// BEFORE:
const scale = 0.5;  // or 0.8
const MAX_DIMENSION = 1000;  // or 1400
const jpegQuality = 0.6;  // or 0.75

// AFTER:
const scale = 2.0;  // 👈 DOUBLED for Chinese characters
const MAX_DIMENSION = 2400;  // 👈 LARGER images
const jpegQuality = 0.95;  // 👈 HIGHER quality
```

### CHANGE 2: Update canvas.toBuffer settings

```typescript
// BEFORE:
return canvas.toBuffer('image/jpeg', {
  quality: 0.75,
  compressionLevel: 9
});

// AFTER:
return canvas.toBuffer('image/png', {  // 👈 PNG instead of JPEG
  compressionLevel: 3  // 👈 Less compression = better quality
});
```

### CHANGE 3: Update viewport intent

```typescript
// BEFORE:
const canvas = await page.render({
  canvasFactory,
  viewport,
  // no intent specified
}).promise;

// AFTER:
const canvas = await page.render({
  canvasFactory,
  viewport,
  intent: 'print'  // 👈 ADD THIS - better quality than 'display'
}).promise;
```

### Full Context Example:

```typescript
async function convertPdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBuffer,
    useSystemFonts: true
  });
  
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  // 👇 UPDATED SETTINGS
  const scale = 2.0;
  const viewport = page.getViewport({ scale });
  
  // Limit dimensions to prevent timeout
  let finalScale = scale;
  const MAX_DIMENSION = 2400;
  
  if (viewport.width > MAX_DIMENSION || viewport.height > MAX_DIMENSION) {
    const scaleFactor = Math.min(
      MAX_DIMENSION / viewport.width,
      MAX_DIMENSION / viewport.height
    );
    finalScale = scale * scaleFactor;
  }
  
  const finalViewport = page.getViewport({ scale: finalScale });
  
  const canvasFactory = new NodeCanvasFactory();
  const canvasAndContext = canvasFactory.create(
    finalViewport.width,
    finalViewport.height
  );
  
  const canvas = await page.render({
    canvasFactory,
    viewport: finalViewport,
    intent: 'print'  // 👈 BETTER QUALITY
  }).promise;
  
  // 👇 PNG WITH MINIMAL COMPRESSION
  return canvas.toBuffer('image/png', {
    compressionLevel: 3,
    filters: canvas.PNG_FILTER_NONE
  });
}
```

---

## File 4: src/lib/openai.ts

### CHANGE: Update system prompt

```typescript
// BEFORE (your existing prompt):
const systemPrompt = `
You are a receipt data extraction expert. Extract structured data from receipt images.

Return ONLY valid JSON, no other text:

{
  "merchant_name": "Business name from receipt",
  "amount": 123.45,
  // ... etc
}
`;

// AFTER (enhanced for Chinese):
const systemPrompt = `
You are an expert at extracting data from receipts and invoices in ANY language (English, Chinese, etc.).

**CRITICAL FOR CHINESE INVOICES (电子发票):**

Field Translations:
- "发票号码" = Invoice Number (typically 20+ digits)
- "开票日期" = Invoice Date (format: YYYY年MM月DD日)
- "销售方信息" / "销售方" = Seller Information section
- "名称" = Company Name (found under seller section)
- "价税合计" = Grand Total (THIS is the total amount to extract)
- "金额" = Amount before tax (subtotal)
- "税额" = Tax Amount
- "统一社会信用代码" = Unified Social Credit Code (Tax ID, 18 chars)
- "项目名称" = Item/Service Description

Common Chinese Categories:
- 住宿服务 / 住宿费 → "Travel" (accommodation/hotel)
- 餐饮服务 → "Food & Dining"
- 交通运输 → "Transportation"  
- 办公用品 → "Office Supplies"
- 咨询服务 / 技术服务 → "Professional Services"
- 会议费 → "Entertainment" (conference/meeting)

**EXTRACTION RULES:**

1. **Amount**: Extract "价税合计" (grand total), NOT "金额" (subtotal)
2. **Date Format**: Convert Chinese date to ISO format
   - Example: "2025年09月10日" → "2025-09-10"
3. **Currency**: 
   - ¥ symbol → "CNY"
   - $ symbol → "USD"
   - € symbol → "EUR"
4. **Merchant Name**: Keep in original language (don't translate)
5. **Invoice Number**: This is CRITICAL for Chinese invoices - extract if visible
6. **Confidence Score**:
   - 1.0 = All fields crystal clear
   - 0.8-0.9 = Most fields clear, some uncertainty
   - 0.6-0.7 = Multiple unclear fields
   - <0.6 = Poor quality image

**FOR ENGLISH/OTHER RECEIPTS:**
- Follow standard receipt extraction
- Look for keywords: "TOTAL", "AMOUNT DUE", "BALANCE"
- Extract merchant name from top of receipt
- Use common sense for category assignment

**OUTPUT FORMAT (MUST be valid JSON):**

{
  "merchant_name": "Company name in original language",
  "amount": 190.00,
  "currency": "CNY",
  "receipt_date": "2025-09-10",
  "category": "Travel",
  "tax_amount": 1.88,
  "payment_method": "Credit Card",
  "invoice_number": "25332000000398124894",
  "confidence_score": 0.95,
  "raw_text": "Full OCR text here for debugging"
}

**IMPORTANT:**
- If any field is unclear, use null (but always return valid JSON)
- Never make up data - if unsure, set confidence low and use null
- For categories, choose from: Food & Dining, Transportation, Shopping, Office Supplies, Travel, Entertainment, Utilities, Healthcare, Other
- Always include raw_text for debugging
`;
```

### CHANGE 2: Update OpenAI API call to use "high" detail

```typescript
// BEFORE:
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
            // no detail specified
          }
        }
      ]
    }
  ],
  max_tokens: 500,
  temperature: 0.1
});

// AFTER:
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
            detail: "high"  // 👈 ADD THIS - critical for Chinese text
          }
        }
      ]
    }
  ],
  max_tokens: 500,
  temperature: 0.1
});
```

---

## File 5: src/components/dashboard/ReceiptList.tsx (if using Option B for routing)

### CHANGE: Update API endpoint URLs

Only needed if Option A (adding export consts) doesn't work:

```typescript
// BEFORE:
const processReceipt = async (id: string) => {
  const response = await fetch(`/api/receipts/${id}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // ...
};

// AFTER:
const processReceipt = async (id: string) => {
  const response = await fetch(`/api/receipts/${id}/action?action=process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // ...
};
```

```typescript
// BEFORE:
const retryReceipt = async (id: string) => {
  const response = await fetch(`/api/receipts/${id}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // ...
};

// AFTER:
const retryReceipt = async (id: string) => {
  const response = await fetch(`/api/receipts/${id}/action?action=retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // ...
};
```

---

## Optional: Add Logging to Monitor Chinese PDF Processing

### File: src/app/api/receipts/[id]/process/route.ts

Add this logging after extraction completes:

```typescript
// After you get the extracted data from OpenAI:
const extractedData = await extractReceiptData(signedUrl);

// 👇 ADD THIS LOGGING
console.log('[Receipt Processing Stats]', {
  receiptId: receipt.id,
  fileName: receipt.file_name,
  fileSize: Math.round(receipt.file_size / 1024) + 'KB',
  processingTime: Date.now() - startTime + 'ms',
  confidence: extractedData.confidence_score,
  hasChineseChars: /[\u4e00-\u9fa5]/.test(extractedData.merchant_name || ''),
  hasCurrency: extractedData.currency,
  extractedAmount: extractedData.amount,
  category: extractedData.category
});
// 👆 END OF LOGGING

// Continue with your existing code to update the receipt...
```

This will help you monitor:
- How long processing takes
- Confidence scores for Chinese vs English
- Success rates
- File sizes that might timeout

---

## Testing Checklist

After making these changes:

### 1. Test Route Configuration
```bash
# Deploy
git add .
git commit -m "fix: add route segment config + improve Chinese extraction"
git push origin main

# Wait 2 minutes, then test
curl -X POST https://receiptsort.seenano.nl/api/receipts/test-id/process \
  -H "Content-Type: application/json" \
  -v

# Should return 200/401 (not 405)
```

### 2. Test Chinese PDF
- Upload: `1760581209670-wkq633.pdf`
- Click "Process"
- Wait 20-30 seconds
- Check extracted fields:
  ```
  ✅ Merchant: 杭州汉盛酒店管理有限公司
  ✅ Invoice: 25332000000398124894
  ✅ Date: 2025-09-10
  ✅ Amount: 190.00
  ✅ Tax: 1.88
  ✅ Currency: CNY
  ✅ Category: Travel
  ```

### 3. Test English Receipt
- Upload any clear English receipt
- Process
- Verify still works correctly

### 4. Check Logs
```bash
vercel logs --follow
```
- Should see processing stats
- Should see completion logs
- No errors

---

## Summary of Changes

| File | Change | Purpose | Priority |
|------|--------|---------|----------|
| `process/route.ts` | Add 3 export lines | Fix 405 error | 🔴 CRITICAL |
| `retry/route.ts` | Add 3 export lines | Fix 405 error | 🔴 CRITICAL |
| `pdf-converter.ts` | Increase quality settings | Fix Chinese chars | 🟡 HIGH |
| `openai.ts` | Update prompt | Improve Chinese extraction | 🟡 HIGH |
| `openai.ts` | Add detail: "high" | Better OCR for Chinese | 🟡 HIGH |
| `ReceiptList.tsx` | Update URLs (only if needed) | Routing fallback | 🟢 IF NEEDED |

---

## Deployment Command

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: resolve PDF processing 405 error and improve Chinese invoice extraction

- Add route segment config (runtime, dynamic, revalidate) to fix Vercel routing
- Increase PDF-to-image quality (scale 2.0x, PNG format, higher resolution)
- Enhance OpenAI prompt with Chinese invoice field translations
- Add high detail parameter to OpenAI Vision API for better Chinese character recognition
- Add processing stats logging for monitoring"

# Push to deploy
git push origin main

# Monitor deployment
vercel logs --follow
```

---

## Expected Results

### Before:
```
POST /api/receipts/xxx/process
→ 405 Method Not Allowed
→ No processing
→ Chinese text garbled if it worked
```

### After:
```
POST /api/receipts/xxx/process
→ 200 OK
→ Processing completes in ~25 seconds
→ Chinese text extracted correctly
→ Confidence score >0.85
```

---

**Copy these code snippets directly into your files and deploy. Good luck! 🚀**
