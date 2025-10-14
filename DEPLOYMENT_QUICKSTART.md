# ReceiptSort Deployment - Quick Start

## TL;DR - Deploy in 5 Steps

### Step 1: Deploy to Vercel (5 minutes)

```bash
cd D:/receiptsort

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Save the Vercel URL (e.g., `receiptsort-xyz.vercel.app`)

### Step 2: Add Environment Variables (10 minutes)

Via Vercel Dashboard (https://vercel.com/dashboard):
1. Select your project → Settings → Environment Variables
2. Copy all from `.env.local` to Vercel
3. Redeploy: `vercel --prod`

### Step 3: Configure DNS (2 minutes)

At your domain registrar (where you manage seenano.nl):

Add CNAME record:
```
Type:  CNAME
Name:  receiptsort
Value: cname.vercel-dns.com
TTL:   3600
```

### Step 4: Add Custom Domain in Vercel (1 minute)

Vercel Dashboard → Your Project → Settings → Domains

Add: `receiptsort.seenano.nl`

Wait 1-5 minutes for SSL certificate to be issued.

### Step 5: Update External Services (5 minutes)

**Stripe:**
- Webhook URL → `https://receiptsort.seenano.nl/api/stripe/webhook`

**Supabase:**
- Site URL → `https://receiptsort.seenano.nl`
- Redirect URLs → Add `https://receiptsort.seenano.nl/auth/callback`

---

## Done! 🎉

Visit: https://receiptsort.seenano.nl

---

## Need Help?

See full guide: `DEPLOYMENT_GUIDE.md`
