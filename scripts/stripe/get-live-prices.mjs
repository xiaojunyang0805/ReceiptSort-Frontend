#!/usr/bin/env node
/**
 * Retrieve live mode price IDs from Stripe
 * This script fetches all products and their prices from Stripe live mode
 */

import Stripe from 'stripe';

// Initialize Stripe with live key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Error: STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

if (stripeSecretKey.startsWith('sk_test_')) {
  console.error('Error: You are using a TEST mode key. Please use a LIVE mode key (sk_live_...)');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
});

async function getLivePrices() {
  try {
    console.log('Fetching products from Stripe (LIVE mode)...\n');

    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`Found ${products.data.length} active products\n`);

    // For each product, get its prices
    const productMap = {
      'Starter': 'STRIPE_PRICE_STARTER',
      'Basic': 'STRIPE_PRICE_BASIC',
      'Pro': 'STRIPE_PRICE_PRO',
      'Business': 'STRIPE_PRICE_BUSINESS',
    };

    const envVars = [];

    for (const product of products.data) {
      const productName = product.name;

      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      if (prices.data.length > 0) {
        const price = prices.data[0]; // Get the first active price

        console.log(`Product: ${productName}`);
        console.log(`  Product ID: ${product.id}`);
        console.log(`  Price ID: ${price.id}`);
        console.log(`  Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
        console.log(`  Type: ${price.type}`);
        console.log('');

        // Check if this product matches our naming convention
        const envVarName = productMap[productName];
        if (envVarName) {
          envVars.push({
            name: envVarName,
            value: price.id,
          });
        }
      }
    }

    // Print environment variables
    console.log('\n=================================');
    console.log('Environment Variables to Set:');
    console.log('=================================\n');

    for (const envVar of envVars) {
      console.log(`${envVar.name}=${envVar.value}`);
    }

    console.log('\n=================================');
    console.log('Vercel Commands to Run:');
    console.log('=================================\n');

    for (const envVar of envVars) {
      console.log(`echo "${envVar.value}" | vercel env add ${envVar.name} production`);
    }

    return envVars;

  } catch (error) {
    console.error('Error fetching prices:', error.message);
    process.exit(1);
  }
}

getLivePrices();
