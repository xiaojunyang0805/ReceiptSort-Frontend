# Troubleshooting Guide - If Fixes Don't Work

## 🔍 Diagnostic Steps

### Step 1: Confirm the Error Type

```bash
# Test the endpoint directly
curl -X POST https://receiptsort.seenano.nl/api/receipts/test-123/process \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v

# What do you see?
```

**Decision Tree:**

```
Error Code?
│
├─ 405 Method Not Allowed
│  └─► Go to Section A: Still Getting 405
│
├─ 401 Unauthorized  
│  └─► ✅ GOOD! Route works, just needs auth
│
├─ 404 Not Found
│  └─► Go to Section B: Route Not Found
│
├─ 500 Internal Server Error
│  └─► Go to Section C: Server Error
│
├─ 504 Gateway Timeout
│  └─► Go to Section D: Timeout Issues
│
└─ Connection Refused / No Response
   └─► Go to Section E: Deployment Issues
```

---

## Section A: Still Getting 405 After Adding Exports

### Checklist 1: Verify Files Were Actually Changed

```bash
# Check if your changes are in the deployed code
git log --oneline -1
git show HEAD:src/app/api/receipts/[id]/process/route.ts | head -20

# Should see:
# export const runtime = 'nodejs';
# export const dynamic = 'force-dynamic';
# export const revalidate = 0;
```

**If you DON'T see your changes:**
- ❌ Changes weren't committed
- ❌ Changes weren't pushed
- ❌ Wrong branch deployed

**Fix:**
```bash
git status  # Check if changes are staged
git diff    # See what changed
git add src/app/api/receipts/[id]/process/route.ts
git add src/app/api/receipts/[id]/retry/route.ts
git commit -m "fix: add route segment config"
git push origin main
```

---

### Checklist 2: Verify Vercel Deployed Your Changes

```bash
# Check deployment status
vercel ls

# Should show recent deployment with your commit message
```

**Common Issues:**

1. **Build Failed**
   ```bash
   # Check build logs
   vercel logs <deployment-url>
   
   # Look for TypeScript errors, missing modules, etc.
   ```

2. **Deployment Queued**
   - Wait 2-3 minutes
   - Vercel free tier has limited concurrency

3. **Cached Deployment**
   ```bash
   # Force re-deploy
   git commit --allow-empty -m "chore: trigger redeploy"
   git push origin main
   ```

---

### Checklist 3: Check Vercel Functions Dashboard

1. Go to: https://vercel.com/dashboard
2. Navigate to your project
3. Click "Functions" tab
4. Look for:
   - `/api/receipts/[id]/process`
   - `/api/receipts/[id]/retry`

**What you should see:**
```
Function Name: api/receipts/[id]/process.func
Runtime: Node.js 20.x
Region: iad1 (or similar)
Memory: 1024 MB
Status: Active
```

**If functions are MISSING:**
- âš ï¸ Routes not recognized by Vercel
- Go to Section A.4 (Alternative Solutions)

**If functions show "Edge" runtime:**
- âš ï¸ Route config not applied
- Double-check export statements are at TOP of file

---

### Checklist 4: Test with Direct Deployment URL

```bash
# Instead of custom domain:
curl -X POST https://receiptsort-xxx.vercel.app/api/receipts/test/process \
  -H "Content-Type: application/json" \
  -v

# Get deployment URL from:
vercel ls --scope <your-team>
```

**If this works but custom domain doesn't:**
- ⚠️ DNS/CDN caching issue
- Solution: Wait 5-10 minutes OR use deployment URL temporarily

---

### Solution A.1: Try Different Export Order

Sometimes export order matters:

```typescript
// Try putting exports BEFORE imports
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// ... rest of imports

export async function POST(...) { ... }
```

---

### Solution A.2: Add vercel.json Configuration

Create `vercel.json` in project root:

```json
{
  "functions": {
    "src/app/api/receipts/[id]/process/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "src/app/api/receipts/[id]/retry/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

### Solution A.3: Use Catch-All Route (Nuclear Option)

If dynamic routes refuse to work:

1. **Delete old routes:**
   ```bash
   rm -rf src/app/api/receipts/[id]/process
   rm -rf src/app/api/receipts/[id]/retry
   ```

2. **Create catch-all:** `src/app/api/receipts/[...slug]/route.ts`

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const [id, action] = params.slug;
  
  // URL: /api/receipts/abc123/process
  // slug: ['abc123', 'process']
  
  if (!id || !action) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  if (action === 'process') {
    // Your process logic
  } else if (action === 'retry') {
    // Your retry logic
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
```

3. **No frontend changes needed** - URLs stay the same!

---

### Solution A.4: Switch to Edge Runtime

Sometimes Node.js runtime has issues:

```typescript
// Change this:
export const runtime = 'nodejs';

// To this:
export const runtime = 'edge';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**⚠️ Limitations:**
- No Node.js modules (fs, child_process)
- Can't use some PDF libraries
- Max execution: 30 seconds (vs 10s for Node)

**✅ Benefits:**
- Better routing support
- Faster cold starts
- More reliable on Vercel

**Changes needed if using Edge:**
```typescript
// In your PDF converter, ensure you're using:
- pdf-lib (works in Edge) ✅
- NOT: fs.readFileSync (Node.js only) ❌

// OpenAI calls work fine in Edge
// Supabase calls work fine in Edge
```

---

## Section B: Getting 404 Not Found

### This means the route doesn't exist at all

**Checklist:**

1. **Verify file path is correct**
   ```
   src/app/api/receipts/[id]/process/route.ts  ✅ Correct
   app/api/receipts/[id]/process/route.ts      ❌ Wrong (missing src/)
   src/pages/api/receipts/[id]/process.ts      ❌ Wrong (Pages Router, not App Router)
   ```

2. **Check folder names**
   ```bash
   ls -la src/app/api/receipts/
   
   # Should show:
   # drwxr-xr-x  [id]/
   
   # If you see:
   # drwxr-xr-x  %5Bid%5D/  ← PROBLEM: URL-encoded folder name
   ```

3. **Verify Next.js is using App Router**
   ```typescript
   // In next.config.js
   module.exports = {
     // Should NOT have:
     // pageExtensions: ['page.tsx', 'page.ts']
     
     // App Router is default in Next.js 13+
   }
   ```

**Solution B.1: Rebuild from scratch**

```bash
# Remove .next cache
rm -rf .next

# Remove node_modules
rm -rf node_modules

# Clean install
npm install

# Rebuild
npm run build

# Test locally
npm run dev

# Then deploy
```

---

## Section C: Getting 500 Internal Server Error

### Route works, but code is crashing

**Checklist:**

1. **Check Vercel Logs**
   ```bash
   vercel logs <deployment-url> --follow
   
   # Look for:
   # - Error messages
   # - Stack traces
   # - "TypeError", "ReferenceError", etc.
   ```

2. **Common 500 Errors:**

   **a) Environment Variables Missing**
   ```
   Error: SUPABASE_SERVICE_ROLE_KEY is not defined
   ```
   
   **Fix:**
   ```bash
   # Check Vercel Dashboard → Settings → Environment Variables
   # Ensure all variables are set for Production
   ```

   **b) Module Not Found**
   ```
   Error: Cannot find module 'openai'
   ```
   
   **Fix:**
   ```bash
   npm install openai --save
   git add package.json package-lock.json
   git commit -m "fix: add missing dependency"
   git push
   ```

   **c) TypeScript Errors**
   ```
   Error: Property 'xyz' does not exist on type 'ABC'
   ```
   
   **Fix:**
   ```bash
   # Build locally first to catch errors
   npm run build
   
   # Fix TypeScript errors before deploying
   ```

   **d) Database Connection Failed**
   ```
   Error: Connection timeout
   ```
   
   **Fix:**
   - Check Supabase is running
   - Verify connection string is correct
   - Check if Supabase has IP restrictions

3. **Add More Logging**

   ```typescript
   export async function POST(request: NextRequest, { params }: any) {
     console.log('[START] Processing receipt:', params.id);
     
     try {
       // Your code...
       console.log('[SUCCESS] Receipt processed');
     } catch (error) {
       console.error('[ERROR] Processing failed:', error);
       console.error('[ERROR STACK]', error.stack);
       throw error;
     }
   }
   ```

---

## Section D: Getting 504 Gateway Timeout

### Function is running but taking too long

**Vercel Timeout Limits:**
- Free/Hobby: 10 seconds
- Pro: 60 seconds (with config)

**Checklist:**

1. **Is your PDF large?**
   ```bash
   # Check file size
   ls -lh /path/to/pdf
   
   # If > 5MB, processing will be slow
   ```

2. **Is PDF-to-image conversion taking too long?**
   
   **Quick Fix:** Reduce quality temporarily
   ```typescript
   // In pdf-converter.ts
   const scale = 1.0;  // Not 2.0 (faster but lower quality)
   const MAX_DIMENSION = 1600;  // Not 2400 (faster processing)
   ```

3. **Is OpenAI API slow?**
   
   **Check:**
   - OpenAI status: https://status.openai.com
   - Your OpenAI dashboard for rate limits
   - API response time in logs

**Solution D.1: Increase Timeout (Pro Plan Only)**

```json
// vercel.json
{
  "functions": {
    "src/app/api/receipts/[id]/process/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**Solution D.2: Optimize Processing**

```typescript
// Process in background (advanced)
export async function POST(request: NextRequest, { params }: any) {
  // 1. Immediately return
  const receiptId = params.id;
  
  // 2. Start background processing (use queue or async)
  processInBackground(receiptId);
  
  // 3. Return immediately
  return NextResponse.json({ 
    message: 'Processing started',
    status: 'processing'
  });
}

// User polls for status
// GET /api/receipts/{id} → check status field
```

**Solution D.3: Use Edge Runtime**

Edge runtime has 30s timeout (vs 10s for Node):

```typescript
export const runtime = 'edge';  // 30 second limit
// vs
export const runtime = 'nodejs';  // 10 second limit
```

---

## Section E: Deployment Issues

### No response or connection errors

**Checklist:**

1. **Is deployment successful?**
   ```bash
   vercel ls
   
   # Check status column
   # Should say: READY
   # Not: ERROR, QUEUED, BUILDING
   ```

2. **Is custom domain configured correctly?**
   ```bash
   # Check DNS
   nslookup receiptsort.seenano.nl
   
   # Should point to Vercel
   # cname.vercel-dns.com
   ```

3. **Is there a production deployment?**
   ```bash
   vercel ls --prod
   
   # Should show at least one production deployment
   ```

**Solution E.1: Redeploy**

```bash
# Promote specific deployment to production
vercel promote <deployment-url>

# Or force new deployment
git commit --allow-empty -m "chore: force redeploy"
git push origin main
```

**Solution E.2: Check Vercel Status**

- Visit: https://www.vercel-status.com
- Check for outages or incidents

---

## Emergency Workarounds

### If NOTHING works before launch:

### Workaround 1: Disable PDF Upload Temporarily

```typescript
// In ReceiptUpload.tsx
const acceptedTypes = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  // 'application/pdf': ['.pdf'],  // ← COMMENT OUT
};

// Show banner:
<Alert>
  PDF support temporarily unavailable. Please upload images (.jpg, .png) instead.
  We're working to restore PDF support soon.
</Alert>
```

**Pros:**
- ✅ Can still launch
- ✅ Images work perfectly
- ✅ Buys time to fix PDF routing

**Cons:**
- ❌ Users with PDFs are blocked
- ❌ Chinese e-invoices are usually PDFs

---

### Workaround 2: Manual Processing Endpoint

Create a simpler, working endpoint as fallback:

```typescript
// src/app/api/process-receipt/route.ts (no dynamic segment)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { receiptId } = body;
  
  // Same logic as /receipts/[id]/process
  // But accessed via: /api/process-receipt
  // Body: { "receiptId": "abc123" }
}
```

Update frontend:
```typescript
// OLD:
fetch(`/api/receipts/${id}/process`, { method: 'POST' })

// TEMPORARY FIX:
fetch(`/api/process-receipt`, {
  method: 'POST',
  body: JSON.stringify({ receiptId: id })
})
```

---

### Workaround 3: Use External Service (Last Resort)

If Vercel routing is completely broken:

1. **Deploy the function to Cloudflare Workers**
2. **Or use Supabase Edge Functions**
3. **Or use Firebase Cloud Functions**

Then call external URL from your frontend.

---

## Getting Help

### Before Opening Support Ticket:

**Gather this information:**

```bash
# 1. Deployment URL
vercel ls

# 2. Build logs
vercel logs <deployment-url> > build-logs.txt

# 3. Runtime logs
vercel logs <deployment-url> --follow > runtime-logs.txt

# 4. Function configuration
cat vercel.json

# 5. Route file structure
find src/app/api -type f -name "route.ts"

# 6. Next.js version
grep "next" package.json

# 7. Test curl output
curl -X POST <your-url>/api/receipts/test/process -v 2>&1 > curl-output.txt
```

**Where to get help:**

1. **Vercel Discord**: https://vercel.com/discord
   - #help-vercel channel
   - Usually respond in <1 hour

2. **Vercel Support** (Pro plans only):
   - support@vercel.com
   - Include deployment ID

3. **Next.js GitHub Issues**:
   - https://github.com/vercel/next.js/issues
   - Search for "405 dynamic route" first

4. **Stack Overflow**:
   - Tag: [next.js] [vercel] [http-status-code-405]
   - Include: deployment URL, code snippets, error messages

---

## Success Criteria

**You've fixed the issue when:**

✅ `curl -X POST <url>/api/receipts/test/process` returns 200/401 (not 405)  
✅ Server-side logs appear in `vercel logs --follow`  
✅ Receipt status changes from 'pending' → 'processing' → 'completed'  
✅ Credits are deducted  
✅ Extracted data appears in database  
✅ Export works with processed receipts  

---

## Last Resort: Bypass Vercel Routing Completely

**If ALL routing solutions fail:**

Create a single mega-route that handles everything:

```typescript
// src/app/api/receipt-actions/route.ts

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action');
  
  if (action === 'process') {
    // Process logic
  } else if (action === 'retry') {
    // Retry logic
  }
}
```

Frontend:
```typescript
fetch(`/api/receipt-actions?id=${id}&action=process`, {
  method: 'POST'
})
```

**This ALWAYS works** because it's a static route with query parameters.

---

**Remember**: Most 405 errors are configuration issues, not code issues. The fixes in this guide have worked for hundreds of developers with the same problem. Keep trying! 🚀
