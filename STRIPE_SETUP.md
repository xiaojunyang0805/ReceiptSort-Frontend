# Stripe Integration Setup Guide

## Overview

This guide covers setting up Stripe payments for credit purchases in ReceiptSort.

## Prerequisites

- Stripe account (https://stripe.com)
- Stripe CLI installed (https://stripe.com/docs/stripe-cli)
- Node.js and npm installed

## 1. Stripe Dashboard Setup

### 1.1 Get API Keys

1. Log in to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Click **Reveal test key** and copy your **Secret key** (starts with `sk_test_`)

### 1.2 Create Products and Prices

Create 4 products with prices for credit packages:

#### Starter Package
- **Name:** Starter Credit Package
- **Description:** 10 credits for $4.99
- **Price:** $4.99 USD (one-time)
- **Copy the Price ID** (starts with `price_`)

#### Basic Package
- **Name:** Basic Credit Package
- **Description:** 25 credits for $9.99
- **Price:** $9.99 USD (one-time)
- **Copy the Price ID** (starts with `price_`)

#### Pro Package
- **Name:** Pro Credit Package
- **Description:** 100 credits for $29.99
- **Price:** $29.99 USD (one-time)
- **Copy the Price ID** (starts with `price_`)

#### Business Package
- **Name:** Business Credit Package
- **Description:** 500 credits for $99.99
- **Price:** $99.99 USD (one-time)
- **Copy the Price ID** (starts with `price_`)

## 2. Environment Variables

### 2.1 Update .env.local

Copy `.env.local.template` to `.env.local` and update with your Stripe keys:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-actual-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-actual-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs (from step 1.2)
STRIPE_PRICE_STARTER=price_your-starter-price-id
STRIPE_PRICE_BASIC=price_your-basic-price-id
STRIPE_PRICE_PRO=price_your-pro-price-id
STRIPE_PRICE_BUSINESS=price_your-business-price-id
```

**Note:** `STRIPE_WEBHOOK_SECRET` will be set up in step 3.

## 3. Webhook Setup for Development

### 3.1 Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download latest release from https://github.com/stripe/stripe-cli/releases
# Or use package manager
```

### 3.2 Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authorize the CLI.

### 3.3 Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy the webhook signing secret** and add it to your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Keep this terminal running** while developing. This forwards Stripe webhooks to your local server.

### 3.4 Test Webhook Events

In a **new terminal**, trigger test events:

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed
```

Check your webhook forwarding terminal to see events being received.

## 4. Database Migration

Run the credit transactions migration:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run migrations/004_create_credit_transactions_table.sql
# in your Supabase SQL Editor
```

This creates:
- `credit_transactions` table
- Indexes for performance
- RLS policies for security

## 5. Testing the Integration

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Checkout Flow

1. Navigate to http://localhost:3000/credits (after implementing the UI)
2. Click a credit package
3. You'll be redirected to Stripe Checkout
4. Use test card: **4242 4242 4242 4242**
   - Any future expiry date
   - Any 3-digit CVC
   - Any postal code

5. Complete the payment
6. You should be redirected back to your app
7. Check your webhook terminal for `checkout.session.completed` event
8. Verify credits were added to your account

### 5.3 Test API Endpoints Manually

**Test Checkout Endpoint:**
```bash
curl -X POST http://localhost:3000/api/credits/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{"package_id": "basic"}'
```

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Test Webhook Endpoint:**
```bash
# This should be tested via Stripe CLI trigger (see 3.4)
stripe trigger checkout.session.completed --add checkout_session:metadata.user_id=YOUR_USER_ID --add checkout_session:metadata.credits=25 --add checkout_session:metadata.package_id=basic
```

## 6. Verify Data Flow

After a test payment:

1. **Check Stripe Dashboard:**
   - Payments > All payments - should show the test payment

2. **Check Database:**
   ```sql
   -- Check user credits updated
   SELECT credits FROM profiles WHERE id = 'your-user-id';

   -- Check transaction recorded
   SELECT * FROM credit_transactions
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC LIMIT 1;
   ```

3. **Check Application Logs:**
   - Checkout API logs
   - Webhook processing logs
   - Credit update confirmation

## 7. Production Deployment

### 7.1 Production Webhook Endpoint

1. Deploy your application to production
2. In Stripe Dashboard, go to **Developers > Webhooks**
3. Click **Add endpoint**
4. Enter URL: `https://your-domain.com/api/stripe/webhook`
5. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded` (for future subscriptions)
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to production environment variables as `STRIPE_WEBHOOK_SECRET`

### 7.2 Production Environment Variables

Update your production environment with:
- Use **live** API keys (starts with `sk_live_` and `pk_live_`)
- Use **production** price IDs
- Use **production** webhook secret from step 7.1
- Set `NEXT_PUBLIC_APP_URL` to your production domain

### 7.3 Test Production

Use **real** credit cards or Stripe test mode in production to verify:
- Checkout flow works
- Webhooks are received
- Credits are added correctly
- Transaction history is recorded

## 8. Troubleshooting

### Webhook Not Received

**Problem:** Webhook endpoint not receiving events

**Solutions:**
1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Verify endpoint is accessible: `curl http://localhost:3000/api/stripe/webhook`
3. Check webhook secret matches in `.env.local`
4. Check dev server logs for errors

### Signature Verification Failed

**Problem:** `Webhook signature verification failed`

**Solutions:**
1. Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
2. Verify you're using the secret from `stripe listen` output
3. Check raw body is being passed (not parsed JSON)
4. Ensure no proxy/middleware is modifying request body

### Credits Not Added

**Problem:** Payment succeeds but credits not added

**Solutions:**
1. Check webhook logs for `checkout.session.completed` event
2. Verify metadata includes `user_id` and `credits`
3. Check database connection and RLS policies
4. Review `handleCheckoutCompleted` function logs
5. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Test Card Declined

**Problem:** Test card 4242 4242 4242 4242 is declined

**Solutions:**
1. Ensure you're in **test mode** (use test API keys)
2. Try other test cards: https://stripe.com/docs/testing#cards
3. Check Stripe Dashboard for error details

## 9. Useful Test Cards

| Card Number         | Description                  |
|---------------------|------------------------------|
| 4242 4242 4242 4242 | Succeeds                     |
| 4000 0025 0000 3155 | Requires 3D Secure           |
| 4000 0000 0000 9995 | Declined (insufficient funds)|
| 4000 0000 0000 0002 | Declined (generic)           |

Use any future expiry, any 3-digit CVC, any postal code.

## 10. Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe CLI Reference:** https://stripe.com/docs/stripe-cli
- **Testing Stripe:** https://stripe.com/docs/testing
- **Webhook Best Practices:** https://stripe.com/docs/webhooks/best-practices
- **Stripe API Reference:** https://stripe.com/docs/api

## 11. Next Steps

After completing this setup:

1. Implement credit purchase UI (`/credits` page)
2. Add credit display in dashboard
3. Implement credit deduction on receipt processing
4. Add purchase history page
5. Set up email notifications for purchases
6. Configure production webhooks
7. Test end-to-end flow in production
