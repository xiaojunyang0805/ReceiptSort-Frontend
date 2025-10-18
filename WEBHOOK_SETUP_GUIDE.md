# Stripe Webhook Setup Guide

## Problem
Webhooks are not configured, so payments complete but credits aren't added and invoices aren't sent.

## Solution: Configure Stripe Webhook

### Step 1: Go to Stripe Dashboard
1. Visit: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"

### Step 2: Configure Webhook Endpoint
1. **Endpoint URL**: `https://receiptsort.vercel.app/api/stripe/webhook`
2. **Description**: "ReceiptSort Production Webhook"
3. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.finalized`
   - `invoice.paid`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Step 3: Get Webhook Signing Secret
1. After creating the webhook, click on it
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)

### Step 4: Add Secret to Vercel
Run this command in the receiptsort directory:

```bash
# Replace YOUR_WEBHOOK_SECRET with the actual secret from Stripe
echo "YOUR_WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET production
```

Or manually:
```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Then paste the secret when prompted
```

### Step 5: Trigger Redeploy
```bash
git commit --allow-empty -m "Trigger redeploy with webhook secret"
git push
```

### Step 6: Test the Webhook
1. Go back to Stripe Dashboard > Webhooks
2. Click on your webhook
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Click "Send test webhook"
6. Check that it shows "Success" (200 response)

## Quick Fix for Current Payment

Since your payment already completed but webhook didn't fire, you need to manually add the credits:

```bash
cd receiptsort
node add-credits-manual.js
```

Then enter:
- Email: 601404242@qq.com
- Credits to add: 25
- Reason: Manual credit addition for completed payment (session: cs_test_...)

---

## For Future: Using Stripe CLI for Local Testing

Install Stripe CLI and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret for local testing.
