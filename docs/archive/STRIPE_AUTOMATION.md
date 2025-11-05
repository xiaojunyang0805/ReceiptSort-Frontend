# Stripe Automation Workflow for Claude

This document contains workflows for Claude to programmatically manage Stripe operations without manual dashboard interaction.

## Prerequisites

- Stripe API keys (test or live)
- Node.js installed in the project
- `stripe` npm package installed

## 1. List All Products and Prices

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  console.log('=== FETCHING STRIPE PRODUCTS ===\n');

  const products = await stripe.products.list({ limit: 100 });

  console.log('Found', products.data.length, 'products:\n');

  for (const product of products.data) {
    console.log('Product:', product.name);
    console.log('  ID:', product.id);
    console.log('  Active:', product.active);

    const prices = await stripe.prices.list({ product: product.id });
    console.log('  Prices:');
    for (const price of prices.data) {
      console.log('    - Price ID:', price.id);
      console.log('      Amount:', (price.unit_amount / 100).toFixed(2), price.currency.toUpperCase());
      console.log('      Type:', price.type);
    }
    console.log('');
  }
})();
```

**Usage:**
```bash
cd receiptsort && node -e "PASTE_CODE_HERE"
```

## 2. Create ReceiptSort Credit Packages

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

const packages = [
  { name: 'Starter Pack', credits: 10, price: 499, description: 'Perfect for trying out the service' },
  { name: 'Basic Pack', credits: 25, price: 999, description: 'Great for regular users' },
  { name: 'Pro Pack', credits: 100, price: 2999, description: 'Best value for power users' },
  { name: 'Business Pack', credits: 500, price: 9999, description: 'For high-volume businesses' }
];

(async () => {
  console.log('=== CREATING RECEIPTSORT CREDIT PACKAGES ===\n');

  const results = {};

  for (const pkg of packages) {
    console.log('Creating:', pkg.name);

    // Create product
    const product = await stripe.products.create({
      name: pkg.name,
      description: `${pkg.description} - ${pkg.credits} credits`,
      metadata: {
        credits: pkg.credits.toString(),
        package_type: 'credit_package'
      }
    });

    console.log('  Product ID:', product.id);

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.price,
      currency: 'usd',
      nickname: pkg.name,
      metadata: {
        credits: pkg.credits.toString()
      }
    });

    console.log('  Price ID:', price.id);
    console.log('  Amount: $' + (price.unit_amount / 100).toFixed(2));
    console.log('');

    results[pkg.name.toLowerCase().replace(' pack', '')] = {
      productId: product.id,
      priceId: price.id,
      amount: price.unit_amount / 100
    };
  }

  console.log('\n=== SUMMARY ===\n');
  console.log('STRIPE_PRICE_STARTER=' + results.starter.priceId);
  console.log('STRIPE_PRICE_BASIC=' + results.basic.priceId);
  console.log('STRIPE_PRICE_PRO=' + results.pro.priceId);
  console.log('STRIPE_PRICE_BUSINESS=' + results.business.priceId);
})();
```

## 3. Verify a Specific Price

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  const priceId = 'price_XXXXXX';
  const price = await stripe.prices.retrieve(priceId);

  console.log('Price ID:', price.id);
  console.log('Amount:', (price.unit_amount / 100).toFixed(2), price.currency.toUpperCase());
  console.log('Type:', price.type);
  console.log('Active:', price.active);
  console.log('Product:', price.product);
})();
```

## 4. List Webhooks

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  const endpoints = await stripe.webhookEndpoints.list();

  console.log('=== WEBHOOK ENDPOINTS ===\n');

  for (const endpoint of endpoints.data) {
    console.log('URL:', endpoint.url);
    console.log('  ID:', endpoint.id);
    console.log('  Status:', endpoint.status);
    console.log('  Events:', endpoint.enabled_events.join(', '));
    console.log('');
  }
})();
```

## 5. Create Webhook Endpoint

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  const endpoint = await stripe.webhookEndpoints.create({
    url: 'https://receiptsort.vercel.app/api/stripe/webhook',
    enabled_events: [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'invoice.payment_succeeded',
      'invoice.finalized',
      'invoice.paid'
    ],
    description: 'ReceiptSort webhook for credit purchases and invoices'
  });

  console.log('Webhook created!');
  console.log('ID:', endpoint.id);
  console.log('Secret:', endpoint.secret);
  console.log('\nAdd this to your .env.local:');
  console.log('STRIPE_WEBHOOK_SECRET=' + endpoint.secret);
})();
```

## 6. Delete Old/Unused Products

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  const productId = 'prod_XXXXXX'; // Replace with actual product ID

  // Archive product (safer than delete)
  const product = await stripe.products.update(productId, {
    active: false
  });

  console.log('Product archived:', product.id);
})();
```

## 7. Update Product Metadata

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  const productId = 'prod_XXXXXX';

  const product = await stripe.products.update(productId, {
    metadata: {
      credits: '25',
      package_type: 'credit_package',
      popular: 'true'
    }
  });

  console.log('Product updated:', product.id);
  console.log('Metadata:', product.metadata);
})();
```

## 8. Test Payment with Test Card

```javascript
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

(async () => {
  // Create a test payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 999, // $9.99
    currency: 'usd',
    payment_method_types: ['card'],
    description: 'Test payment for ReceiptSort Basic Pack'
  });

  console.log('Payment Intent created:', paymentIntent.id);
  console.log('Client Secret:', paymentIntent.client_secret);
  console.log('\nUse test card: 4242 4242 4242 4242');
})();
```

## Common Workflows

### Switching from Live to Test Mode

1. Get test API keys from Stripe Dashboard
2. Run workflow #2 to create test products
3. Update `.env.local` with test keys and price IDs
4. Restart dev server

### Switching from Test to Live Mode

1. Get live API keys from Stripe Dashboard
2. Run workflow #2 with live key to create live products
3. Update `.env.local` with live keys and price IDs
4. Update Vercel environment variables
5. Redeploy application

### Setting Up Webhooks

1. Run workflow #4 to list existing webhooks
2. If none exist, run workflow #5 to create webhook
3. Copy webhook secret to `.env.local`
4. Test webhook using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## Quick Reference

### Test Credit Card Numbers

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date (e.g., 12/30), any 3-digit CVC

### Environment Variables

```env
# Test Mode
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Live Mode
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Price IDs Location

- Test mode: Created via workflow #2
- Live mode: Created via workflow #2 with live key
- Stored in: `.env.local` for local dev, Vercel dashboard for production

## Troubleshooting

### "No such price" error
Run workflow #1 to verify price exists and is active

### "$0.00 invoice" error
Run workflow #3 to verify price has correct unit_amount

### "Webhook signature verification failed"
Run workflow #4 to get correct webhook secret

### "Product not found"
Run workflow #1 to list all products and find correct ID

## Last Updated

Created: 2025-10-18
Updated: 2025-10-18

## Notes

- All Stripe operations are idempotent where possible
- Test mode and live mode data are completely separate
- Price IDs cannot be reused between test and live mode
- Always verify price amounts before going live
