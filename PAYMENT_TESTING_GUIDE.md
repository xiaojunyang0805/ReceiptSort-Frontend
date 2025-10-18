# Payment Testing & Debugging Guide

## 🎯 Quick Start

### Run Automated Tests Locally

```bash
# Quick test (diagnoses common issues)
node tests/quick-test.js

# Full test suite
node tests/payment-flow.test.js
```

### Test Results Summary

**Local Environment:** ✅ ALL TESTS PASSING
- Stripe API connection: ✅ Working
- Price retrieval: ✅ Working
- Checkout session creation: ✅ Working

**Production Environment:** ❌ FAILING
- Error: "An error occurred with our connection to Stripe. Request was retried 2 times."
- Root Cause: **STRIPE_PRICE_* environment variables are NOT set in production**

## 🐛 Current Issue

### Problem
When clicking "Purchase" on https://receiptsort.vercel.app/credits, users see:
```
An error occurred with our connection to Stripe. Request was retried 2 times.
```

### Root Cause
Vercel production environment is **missing the STRIPE_PRICE_* environment variables**.

Running `vercel env pull` shows:
- ✅ `STRIPE_SECRET_KEY` is set (test mode)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set (test mode)
- ❌ `STRIPE_PRICE_STARTER` is NOT in environment
- ❌ `STRIPE_PRICE_BASIC` is NOT in environment
- ❌ `STRIPE_PRICE_PRO` is NOT in environment
- ❌ `STRIPE_PRICE_BUSINESS` is NOT in environment

### Why This Happens
When we ran `vercel env add STRIPE_PRICE_BASIC production --force`, it added the variable to Vercel's database, but:
1. The deployment needs to be triggered AFTER env vars are added
2. OR we need to wait for Vercel to propagate the changes (can take several minutes)
3. OR there's a caching issue

## ✅ Solution Steps

### Option 1: Verify and Redeploy (Recommended)

```bash
# 1. Verify all env vars are set on Vercel
vercel env ls | grep STRIPE

# Expected output should show:
# STRIPE_SECRET_KEY                      Encrypted   Production
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY     Encrypted   Production
# STRIPE_PRICE_STARTER                   Encrypted   Production
# STRIPE_PRICE_BASIC                     Encrypted   Production
# STRIPE_PRICE_PRO                       Encrypted   Production
# STRIPE_PRICE_BUSINESS                  Encrypted   Production

# 2. If any are missing, add them:
echo "price_1SJV7L2Q25JDcEYXN7qC2OoR" | vercel env add STRIPE_PRICE_STARTER production --force
echo "price_1SJV7M2Q25JDcEYXOcEy3eUy" | vercel env add STRIPE_PRICE_BASIC production --force
echo "price_1SJV7M2Q25JDcEYXrww1qskN" | vercel env add STRIPE_PRICE_PRO production --force
echo "price_1SJV7N2Q25JDcEYXEULPIDoK" | vercel env add STRIPE_PRICE_BUSINESS production --force

# 3. Trigger a new deployment
git commit --allow-empty -m "Trigger redeploy"
git push

# 4. Wait 1-2 minutes for deployment

# 5. Test again at https://receiptsort.vercel.app/credits
```

### Option 2: Use Vercel Dashboard

1. Go to https://vercel.com/xiaojunyang0805s-projects/receiptsort/settings/environment-variables
2. Check if all STRIPE_PRICE_* variables exist
3. If missing, add them manually:
   - `STRIPE_PRICE_STARTER` = `price_1SJV7L2Q25JDcEYXN7qC2OoR`
   - `STRIPE_PRICE_BASIC` = `price_1SJV7M2Q25JDcEYXOcEy3eUy`
   - `STRIPE_PRICE_PRO` = `price_1SJV7M2Q25JDcEYXrww1qskN`
   - `STRIPE_PRICE_BUSINESS` = `price_1SJV7N2Q25JDcEYXEULPIDoK`
4. Select "Production" environment
5. Click "Save"
6. Redeploy

## 📊 Test Suite Features

### Quick Test (`tests/quick-test.js`)
- ✅ Validates environment variables
- ✅ Tests Stripe API connection
- ✅ Retrieves and validates price
- ✅ Creates test checkout session
- ⚡ Fast (~2 seconds)

### Full Test Suite (`tests/payment-flow.test.js`)
- ✅ All quick test features
- ✅ Tests invoice creation
- ✅ Tests API endpoint connectivity
- ✅ Validates environment variable modes (test vs live)
- ✅ Comprehensive error reporting
- 🧪 Complete coverage (~10 seconds)

### CI/CD Integration
- GitHub Actions workflow: `.github/workflows/payment-tests.yml`
- Runs automatically on:
  - Push to main branch (affecting payment code)
  - Pull requests
  - Manual trigger
- Prevents deployment of broken payment code

## 🔍 Debugging Tips

### Check Current Deployment

```bash
# List recent deployments
vercel ls

# Check which deployment is live
curl -I https://receiptsort.vercel.app | grep x-vercel-id
```

### View Deployment Logs

```bash
# Get logs from specific deployment
vercel logs https://receiptsort-XXXXXX.vercel.app

# Or from domain
vercel logs https://receiptsort.vercel.app
```

### Test Locally with Production Env Vars

```bash
# Pull production environment variables
vercel env pull .env.production.local

# Run Next.js with production env
NODE_ENV=production npm run dev

# Test the checkout
node tests/quick-test.js
```

## 📝 Environment Variables Reference

### Required Variables (Production)

| Variable | Value (Test Mode) | Environment |
|----------|-------------------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_51SFHT62Q25JDcEYX...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_51SFHT62Q25JDcEYX...` | Production, Preview, Development |
| `STRIPE_PRICE_STARTER` | `price_1SJV7L2Q25JDcEYXN7qC2OoR` | Production, Preview, Development |
| `STRIPE_PRICE_BASIC` | `price_1SJV7M2Q25JDcEYXOcEy3eUy` | Production, Preview, Development |
| `STRIPE_PRICE_PRO` | `price_1SJV7M2Q25JDcEYXrww1qskN` | Production, Preview, Development |
| `STRIPE_PRICE_BUSINESS` | `price_1SJV7N2Q25JDcEYXEULPIDoK` | Production, Preview, Development |

### Common Issues

#### Issue: "Connection to Stripe" Error
**Cause:** Missing or mismatched environment variables
**Solution:** Run `node tests/quick-test.js` to diagnose, then add missing vars

#### Issue: "$0.00 Invoice"
**Cause:** Using invoice mode instead of checkout mode
**Solution:** Already fixed in `src/app/api/credits/checkout/route.ts:33`

#### Issue: "Redirects to Login After Payment"
**Cause:** Hardcoded production URL in local development
**Solution:** Already fixed in `src/lib/stripe.ts` to use `process.env.NEXT_PUBLIC_URL`

#### Issue: Test Mode Key with Live Prices (or vice versa)
**Cause:** Environment variable mismatch
**Solution:** Ensure ALL Stripe variables use the same mode (test or live)

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Run `node tests/quick-test.js` locally ✅
- [ ] Run `node tests/payment-flow.test.js` locally ✅
- [ ] Verify all env vars in Vercel dashboard
- [ ] Ensure test mode keys for testing OR live mode keys for production
- [ ] Test one package purchase end-to-end
- [ ] Check Stripe dashboard for test transactions
- [ ] Verify webhook is configured (if using)

## 📚 Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe API Versions](https://stripe.com/docs/api/versioning)

## 🆘 Still Having Issues?

1. Run the quick test: `node tests/quick-test.js`
2. Check the error output
3. Compare with this guide
4. If still stuck, check Vercel logs: `vercel logs https://receiptsort.vercel.app`

---

**Last Updated:** 2025-10-18
**Status:** Local tests passing ✅ | Production needs env var fix ⚠️
