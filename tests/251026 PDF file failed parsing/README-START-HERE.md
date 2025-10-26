# ReceiptSort PDF Processing Fix - START HERE

## 📋 Quick Summary

**Problem**: Chinese PDF invoices cannot be processed (HTTP 405 error + garbled text)  
**Impact**: Critical - blocks all PDF processing before launch  
**Time to Fix**: 1-2 hours (optimistic), up to 4-6 hours (realistic)  
**Difficulty**: Medium - mostly configuration, some prompt engineering

---

## 🎯 What You Need to Know

### The Two Issues

1. **HTTP 405 Error** (CRITICAL - Fix First)
   - Vercel routing not recognizing dynamic API routes
   - Blocks ALL PDF processing
   - Fix: Add 3 lines of route configuration

2. **Chinese Character Garbling** (HIGH - Fix Second)  
   - Text extraction shows gibberish instead of Chinese
   - Fix: Increase image quality + enhance OpenAI prompt

---

## 📁 Documents Provided

### 1. **Quick-Start-Fix-Guide.md** ⭐ START HERE
   - Step-by-step immediate fixes
   - 15-30 minute quick wins
   - Minimal explanation, maximum action
   - **Read this FIRST**

### 2. **Exact-Code-Changes.md** ⭐ USE THIS WHILE CODING
   - Copy-paste code snippets
   - Exact lines to change in each file
   - No guessing what goes where
   - **Keep this open while coding**

### 3. **PDF-Parsing-Fix-Plan.md** (Comprehensive)
   - Full analysis of both issues
   - Multiple solution approaches
   - Risk mitigation strategies
   - Post-fix validation
   - **Read for deep understanding**

### 4. **Visual-Problem-Breakdown.md** (Understanding)
   - ASCII diagrams of the problem
   - Flow charts showing error path
   - Visual comparison: before vs after
   - **Read to understand WHY fixes work**

### 5. **Troubleshooting-Guide.md** (If Things Go Wrong)
   - What to do if fixes don't work
   - Debug checklist
   - Alternative solutions
   - Emergency workarounds
   - **Read ONLY if stuck**

---

## ⚡ Quick Start (Do This Now)

### Phase 1: Fix 405 Error (15 minutes)

1. **Open these files:**
   - `src/app/api/receipts/[id]/process/route.ts`
   - `src/app/api/receipts/[id]/retry/route.ts`

2. **Add these 3 lines** to BOTH files (after imports):
   ```typescript
   export const runtime = 'nodejs';
   export const dynamic = 'force-dynamic';
   export const revalidate = 0;
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "fix: add route segment config for Vercel"
   git push origin main
   ```

4. **Test** (wait 2 minutes for deployment):
   ```bash
   curl -X POST https://receiptsort.seenano.nl/api/receipts/test/process \
     -H "Content-Type: application/json" \
     -v
   
   # Should return 200/401 (not 405)
   ```

5. **If it works:** ✅ Move to Phase 2  
   **If it fails:** ❌ See `Troubleshooting-Guide.md` Section A

---

### Phase 2: Fix Chinese Extraction (30 minutes)

1. **Open:** `src/lib/pdf-converter.ts`

2. **Change these values:**
   ```typescript
   const scale = 2.0;           // was 0.5 or 0.8
   const MAX_DIMENSION = 2400;  // was 1000 or 1400
   const jpegQuality = 0.95;    // was 0.6 or 0.75
   ```

3. **Open:** `src/lib/openai.ts`

4. **Replace system prompt** with enhanced version from `Exact-Code-Changes.md`
   - Includes Chinese field translations
   - Adds invoice structure rules
   - Uses `detail: "high"` for OCR

5. **Deploy and test:**
   ```bash
   git add .
   git commit -m "fix: improve Chinese invoice extraction"
   git push origin main
   ```

6. **Test with Chinese PDF:**
   - Upload: `1760581209670-wkq633.pdf`
   - Process
   - Verify: Merchant, Invoice#, Date, Amount all correct

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] POST returns 200/401 (not 405)
- [ ] Status changes to "processing"
- [ ] Server logs appear
- [ ] Credits deducted

### Phase 2 Complete When:
- [ ] Invoice#: 25332000000398124894 ✓
- [ ] Date: 2025-09-10 ✓
- [ ] Merchant: 杭州汉盛酒店管理有限公司 ✓
- [ ] Amount: 190.00 ✓
- [ ] No garbled text

---

## 🚨 If You Get Stuck

### After 1 Hour of Trying Phase 1:

**Option A**: Try alternative routing structure
- See `Quick-Start-Fix-Guide.md` → Step 1 → Option B
- Restructure to use `/action?action=process` endpoint

**Option B**: Use troubleshooting guide
- See `Troubleshooting-Guide.md` → Section A
- Systematic diagnostic steps

**Option C**: Emergency workaround
- Temporarily disable PDF uploads
- Launch with images only
- Fix PDF support post-launch

### After 2 Hours Total (Both Phases):

**Decision Point:**
- ✅ If Phase 1 works but Phase 2 is <80% accurate:
  - **Can launch anyway** with manual correction UI
  - Iterate on extraction post-launch
  
- ❌ If Phase 1 still fails:
  - **Must fix before launch** - blocks all PDFs
  - Consider consulting Vercel support
  - Or use emergency workaround

---

## 📊 Expected Timeline

| Scenario | Phase 1 | Phase 2 | Total |
|----------|---------|---------|-------|
| **Best Case** | 15 min | 30 min | 45 min |
| **Realistic** | 1 hour | 1 hour | 2 hours |
| **Worst Case** | 2 hours | 2 hours | 4 hours |

**Plan for Realistic**: 2 hours total

---

## 🎯 What to Do Right Now

1. **Read** `Quick-Start-Fix-Guide.md` (5 minutes)
2. **Apply** fixes from `Exact-Code-Changes.md` (30 minutes)
3. **Test** with the Chinese PDF (10 minutes)
4. **Iterate** if accuracy is low (30 minutes)

**Total: 75 minutes** to working PDF processing

---

## 📞 Getting Help

### If completely stuck:

**Option 1: Claude Code**
- Share error messages
- Share deployment logs
- Ask for specific debugging steps

**Option 2: Vercel Discord**
- https://vercel.com/discord
- #help-vercel channel
- Include: deployment URL, error code, route structure

**Option 3: This Documentation**
- `Troubleshooting-Guide.md` has answers for most issues
- Systematic approach to finding root cause

---

## 🚀 Launch Decision Tree

```
Can you fix Phase 1 (405) in < 2 hours?
│
├─ YES → Fix it now, then launch
│   │
│   └─ Is Phase 2 >80% accurate?
│      ├─ YES → ✅ LAUNCH with full PDF support
│      └─ NO → ✅ LAUNCH with manual correction UI
│
└─ NO → Emergency decision:
    │
    ├─ Option A: Disable PDF support temporarily
    │   └─ ✅ LAUNCH with images only
    │       (Fix PDF post-launch)
    │
    └─ Option B: Delay launch 1-2 days
        └─ Get expert help on routing issue
            (Vercel support, consultant, etc.)
```

**Recommendation**: Try to fix Phase 1 for 2 hours max. If not working, launch with images only and fix PDF support in week 2.

---

## 💡 Key Insights

### Why This Is Happening:

1. **405 Error**: 
   - Vercel's edge network doesn't recognize Next.js 14 dynamic routes without explicit config
   - Common issue, well-documented, solvable

2. **Chinese Garbling**:
   - PDF uses `UniGB-UCS2-H` encoding (not standard ASCII)
   - Low-quality images make Chinese characters unreadable
   - OpenAI needs high-res images + proper prompting

### Why The Fixes Work:

1. **Route Config**:
   - Tells Vercel: "This is a dynamic route with POST handler"
   - Forces Node.js runtime (better compatibility)
   - Disables static optimization (dynamic = must run on server)

2. **Quality Increase**:
   - 2.0x scale = 4x more pixels = clearer Chinese characters
   - PNG = lossless (vs JPEG lossy compression)
   - OpenAI "high" detail = processes at full resolution

### Why This Matters:

- **Without PDF support**: Chinese market is blocked (most invoices are PDFs)
- **With buggy extraction**: Manual correction needed (but acceptable for MVP)
- **With perfect extraction**: Competitive advantage in Chinese market

---

## 📈 Post-Fix Next Steps

### After Phase 1 Works:
1. Test with 5+ different PDFs
2. Monitor processing time (<30 seconds target)
3. Track success rate (>90% target)

### After Phase 2 Works:
1. Test with Chinese receipts from different provinces
2. Test with Traditional Chinese (Taiwan/HK)
3. Build feedback loop for low-confidence extractions

### Week 2 (Post-Launch):
1. Add multi-language support (Japanese, Korean)
2. Optimize processing time
3. Add batch processing
4. Integrate QuickBooks/Xero

---

## 🎓 Learning from This

**What went wrong:**
- No early testing with Chinese PDFs
- Assumed text extraction would work (didn't test encoding)
- Vercel routing config not documented in build plan

**What to do differently:**
- Test with diverse input (languages, formats, qualities)
- Verify deployment infrastructure before building features
- Have backup plans for critical features

**What you learned:**
- Next.js 14 routing quirks
- PDF encoding challenges
- OpenAI Vision prompt engineering
- Vercel deployment debugging

---

## ✨ Final Checklist

Before you start coding:
- [ ] Read `Quick-Start-Fix-Guide.md`
- [ ] Have `Exact-Code-Changes.md` open
- [ ] Chinese PDF ready for testing
- [ ] 2 hours blocked on calendar
- [ ] Deployment access ready
- [ ] Vercel logs accessible

You're ready! Start with Phase 1, Step 1, Option A. Good luck! 🚀

---

**Document Version**: 1.0  
**Created**: October 26, 2025  
**For**: ReceiptSort Pre-Launch PDF Fix  
**Next Update**: After successful fix + lessons learned
