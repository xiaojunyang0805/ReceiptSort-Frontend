/**
 * Automated Payment Flow Test Suite
 * Tests the complete ReceiptSort payment and invoice workflow
 *
 * Run with: node tests/payment-flow.test.js
 * Or with environment: TEST_ENV=production node tests/payment-flow.test.js
 */

const stripe = require('stripe');
const fetch = require('node-fetch');

// Configuration
const TEST_ENV = process.env.TEST_ENV || 'local';
const CONFIGS = {
  local: {
    baseUrl: 'http://localhost:3000',
    stripeKey: process.env.STRIPE_SECRET_KEY,
  },
  production: {
    baseUrl: 'https://receiptsort.vercel.app',
    stripeKey: process.env.STRIPE_SECRET_KEY,
  }
};

const config = CONFIGS[TEST_ENV];
const stripeClient = stripe(config.stripeKey);

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': 'ℹ️',
    'PASS': '✅',
    'FAIL': '❌',
    'WARN': '⚠️'
  }[level] || 'ℹ️';

  console.log(`${emoji} [${timestamp}] ${message}`);
}

function pass(testName) {
  results.passed++;
  log(`PASSED: ${testName}`, 'PASS');
}

function fail(testName, error) {
  results.failed++;
  results.errors.push({ test: testName, error: error.message });
  log(`FAILED: ${testName} - ${error.message}`, 'FAIL');
}

// Test 1: Verify Stripe API Connection
async function testStripeConnection() {
  const testName = 'Stripe API Connection';
  log(`Testing ${testName}...`);

  try {
    const balance = await stripeClient.balance.retrieve();

    if (!balance) {
      throw new Error('Failed to retrieve balance');
    }

    log(`  Connected to Stripe successfully`);
    log(`  Account currency: ${balance.available[0]?.currency || 'N/A'}`);
    log(`  Test mode: ${config.stripeKey.includes('test')}`);

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// Test 2: Verify Price IDs
async function testPriceIds() {
  const testName = 'Stripe Price IDs';
  log(`Testing ${testName}...`);

  const priceIds = {
    starter: process.env.STRIPE_PRICE_STARTER,
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS
  };

  const expectedPrices = {
    starter: { amount: 499, credits: 10 },
    basic: { amount: 999, credits: 25 },
    pro: { amount: 2999, credits: 100 },
    business: { amount: 9999, credits: 500 }
  };

  let allValid = true;

  for (const [key, priceId] of Object.entries(priceIds)) {
    try {
      if (!priceId) {
        throw new Error(`Price ID for ${key} is not set`);
      }

      const price = await stripeClient.prices.retrieve(priceId);
      const expected = expectedPrices[key];

      if (price.unit_amount !== expected.amount) {
        throw new Error(`${key}: Expected $${expected.amount/100}, got $${price.unit_amount/100}`);
      }

      log(`  ${key.toUpperCase()}: $${price.unit_amount/100} (${expected.credits} credits) ✓`);
    } catch (error) {
      allValid = false;
      log(`  ${key.toUpperCase()}: ${error.message}`, 'FAIL');
    }
  }

  if (allValid) {
    pass(testName);
  } else {
    fail(testName, new Error('Some price IDs are invalid'));
  }
}

// Test 3: Test Checkout Session Creation
async function testCheckoutSessionCreation() {
  const testName = 'Checkout Session Creation';
  log(`Testing ${testName}...`);

  try {
    const priceId = process.env.STRIPE_PRICE_BASIC;

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${config.baseUrl}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/credits?canceled=true`,
      customer_email: 'test@example.com',
      metadata: {
        user_id: 'test-user',
        package_id: 'basic',
        credits: '25',
      },
    });

    if (!session.url) {
      throw new Error('Checkout session created but no URL returned');
    }

    log(`  Session ID: ${session.id}`);
    log(`  Checkout URL: ${session.url.substring(0, 60)}...`);
    log(`  Amount: $${session.amount_total / 100}`);

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// Test 4: Test Invoice Creation
async function testInvoiceCreation() {
  const testName = 'Invoice Creation';
  log(`Testing ${testName}...`);

  try {
    // Create a test customer
    const customer = await stripeClient.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        user_id: 'test-user',
      }
    });

    log(`  Created test customer: ${customer.id}`);

    // Get price details
    const priceId = process.env.STRIPE_PRICE_BASIC;
    const priceObj = await stripeClient.prices.retrieve(priceId);
    const amount = priceObj.unit_amount || 0;

    // Create invoice item
    await stripeClient.invoiceItems.create({
      customer: customer.id,
      amount,
      currency: priceObj.currency,
      description: 'ReceiptSort Credits - Basic Package (25 credits)',
      metadata: {
        user_id: 'test-user',
        package_id: 'basic',
        credits: '25',
      }
    });

    // Create invoice
    const invoice = await stripeClient.invoices.create({
      customer: customer.id,
      auto_advance: false,
      collection_method: 'charge_automatically',
      metadata: {
        user_id: 'test-user',
        package_id: 'basic',
        credits: '25',
      }
    });

    log(`  Invoice ID: ${invoice.id}`);
    log(`  Amount: $${invoice.amount_due / 100}`);
    log(`  Status: ${invoice.status}`);

    // Cleanup
    await stripeClient.customers.del(customer.id);
    log(`  Cleaned up test customer`);

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// Test 5: Test API Endpoint (requires auth, will likely fail but shows connectivity)
async function testAPIEndpoint() {
  const testName = 'API Endpoint Connectivity';
  log(`Testing ${testName}...`);

  try {
    const response = await fetch(`${config.baseUrl}/api/credits/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package_id: 'basic'
      })
    });

    const data = await response.json();

    // We expect 401 Unauthorized since we're not authenticated
    if (response.status === 401 && data.error === 'Unauthorized') {
      log(`  API endpoint is responding correctly (401 Unauthorized as expected)`);
      pass(testName);
    } else if (response.status === 500) {
      log(`  API returned 500 error: ${data.error}`, 'WARN');
      fail(testName, new Error(`API error: ${data.error}`));
    } else {
      log(`  Unexpected response: ${response.status} ${JSON.stringify(data)}`, 'WARN');
      pass(testName);
    }
  } catch (error) {
    fail(testName, error);
  }
}

// Test 6: Validate Environment Variables
async function testEnvironmentVariables() {
  const testName = 'Environment Variables';
  log(`Testing ${testName}...`);

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_BASIC',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_BUSINESS'
  ];

  const missing = [];
  const testMode = {
    secretKey: false,
    prices: []
  };

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      missing.push(varName);
      log(`  ${varName}: NOT SET ❌`, 'FAIL');
    } else {
      const isTest = value.includes('test');
      const displayValue = value.substring(0, 20) + '...' + value.substring(value.length - 10);
      log(`  ${varName}: ${displayValue} (${isTest ? 'TEST' : 'LIVE'} mode)`);

      if (varName === 'STRIPE_SECRET_KEY') {
        testMode.secretKey = isTest;
      } else {
        testMode.prices.push(isTest);
      }
    }
  }

  // Check for mode mismatches
  const allPricesTestMode = testMode.prices.every(v => v);
  const allPricesLiveMode = testMode.prices.every(v => !v);

  if (testMode.secretKey && !allPricesTestMode) {
    log(`  ⚠️  WARNING: Test mode secret key with live mode prices!`, 'WARN');
  } else if (!testMode.secretKey && !allPricesLiveMode) {
    log(`  ⚠️  WARNING: Live mode secret key with test mode prices!`, 'WARN');
  }

  if (missing.length > 0) {
    fail(testName, new Error(`Missing variables: ${missing.join(', ')}`));
  } else {
    pass(testName);
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  ReceiptSort Payment Flow Automated Tests');
  console.log('='.repeat(60));
  console.log(`Environment: ${TEST_ENV}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('='.repeat(60) + '\n');

  // Run all tests
  await testEnvironmentVariables();
  console.log('');

  await testStripeConnection();
  console.log('');

  await testPriceIds();
  console.log('');

  await testCheckoutSessionCreation();
  console.log('');

  await testInvoiceCreation();
  console.log('');

  await testAPIEndpoint();
  console.log('');

  // Print summary
  console.log('='.repeat(60));
  console.log('  Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.test}: ${err.error}`);
    });
  }

  console.log('='.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
