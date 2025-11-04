#!/usr/bin/env node
/**
 * Quick Stripe Connection Test
 * Usage: node tests/quick-test.js
 */

const stripe = require('stripe');

// Load environment variables from .env.local if running locally
require('dotenv').config({ path: '.env.local' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC;

console.log('\n🔍 Quick Stripe Connection Test\n');
console.log('━'.repeat(50));

async function quickTest() {
  try {
    // Test 1: Check environment variables
    console.log('\n1️⃣  Environment Variables:');
    if (!STRIPE_SECRET_KEY) {
      console.log('   ❌ STRIPE_SECRET_KEY is not set');
      process.exit(1);
    }
    const keyMode = STRIPE_SECRET_KEY.includes('test') ? 'TEST' : 'LIVE';
    console.log(`   ✅ STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY.substring(0, 15)}... (${keyMode} mode)`);

    if (!STRIPE_PRICE_BASIC) {
      console.log('   ❌ STRIPE_PRICE_BASIC is not set');
      process.exit(1);
    }
    const priceMode = STRIPE_PRICE_BASIC.includes('test') ? 'TEST' : 'LIVE';
    console.log(`   ✅ STRIPE_PRICE_BASIC: ${STRIPE_PRICE_BASIC} (${priceMode} mode)`);

    // Check for mode mismatch
    if (keyMode !== priceMode) {
      console.log(`   ⚠️  WARNING: Secret key is ${keyMode} mode but price is ${priceMode} mode!`);
      console.log(`   This will cause "connection to Stripe" errors!`);
    }

    // Test 2: Initialize Stripe client
    console.log('\n2️⃣  Initializing Stripe client...');
    const stripeClient = stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
    console.log('   ✅ Stripe client initialized');

    // Test 3: Test API connection
    console.log('\n3️⃣  Testing Stripe API connection...');
    const balance = await stripeClient.balance.retrieve();
    console.log(`   ✅ Connected to Stripe successfully`);
    console.log(`   Currency: ${balance.available[0]?.currency || 'N/A'}`);

    // Test 4: Retrieve price
    console.log('\n4️⃣  Retrieving price...');
    const price = await stripeClient.prices.retrieve(STRIPE_PRICE_BASIC);
    console.log(`   ✅ Price retrieved successfully`);
    console.log(`   Price ID: ${price.id}`);
    console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
    console.log(`   Type: ${price.type}`);
    console.log(`   Active: ${price.active}`);

    // Test 5: Create test checkout session
    console.log('\n5️⃣  Creating test checkout session...');
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: STRIPE_PRICE_BASIC,
          quantity: 1,
        },
      ],
      success_url: 'https://receiptsort.vercel.app/credits?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://receiptsort.vercel.app/credits?canceled=true',
      customer_email: 'test@example.com',
      metadata: {
        user_id: 'test-user',
        package_id: 'basic',
        credits: '25',
      },
    });

    console.log(`   ✅ Checkout session created successfully`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   URL: ${session.url}`);
    console.log(`   Amount: $${(session.amount_total / 100).toFixed(2)}`);

    console.log('\n' + '━'.repeat(50));
    console.log('✅ All tests passed! Stripe connection is working.\n');
    process.exit(0);

  } catch (error) {
    console.log('\n' + '━'.repeat(50));
    console.log('❌ Test failed!');
    console.log('\nError Details:');
    console.log(`   Type: ${error.type || 'Unknown'}`);
    console.log(`   Message: ${error.message}`);
    if (error.raw) {
      console.log(`   Raw: ${JSON.stringify(error.raw, null, 2)}`);
    }
    console.log('\n' + '━'.repeat(50) + '\n');
    process.exit(1);
  }
}

quickTest();
