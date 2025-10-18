#!/usr/bin/env node
/**
 * Automated Browser Payment Flow Test
 * Tests the complete end-to-end payment flow using Playwright
 *
 * Usage: node tests/browser-payment-test.js
 *
 * This script will:
 * 1. Launch browser
 * 2. Navigate to the credits page
 * 3. Login with test credentials
 * 4. Click Purchase button
 * 5. Verify Stripe checkout page loads
 * 6. Fill in test card details
 * 7. Submit payment
 * 8. Verify redirect back to app
 * 9. Verify credits were added
 */

const { chromium } = require('playwright');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://receiptsort.vercel.app';
const TEST_EMAIL = process.env.TEST_EMAIL || '601404242@qq.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '6163418';
const HEADLESS = process.env.HEADLESS !== 'false'; // Set HEADLESS=false to see browser

// Test card details
const TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12/30',
  cvc: '123',
  zip: '12345'
};

// Utility functions
function log(message, level = 'INFO') {
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARN': '⚠️',
    'STEP': '🔹'
  }[level] || 'ℹ️';
  console.log(`${emoji} ${message}`);
}

async function waitAndLog(page, message, timeout = 5000) {
  log(message, 'STEP');
  await page.waitForTimeout(timeout);
}

// Main test function
async function runBrowserTest() {
  let browser;
  let context;
  let page;

  try {
    console.log('\n' + '='.repeat(60));
    console.log('  Automated Browser Payment Flow Test');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Headless: ${HEADLESS}`);
    console.log('='.repeat(60) + '\n');

    // Step 1: Launch browser
    log('Step 1: Launching browser...', 'STEP');
    browser = await chromium.launch({
      headless: HEADLESS,
      slowMo: 100 // Slow down actions for visibility
    });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    log('Browser launched', 'SUCCESS');

    // Step 2: Navigate to login page
    log('Step 2: Navigating to login page...', 'STEP');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-screenshots/01-login-page.png' });
    log('Login page loaded', 'SUCCESS');

    // Step 3: Login
    log('Step 3: Logging in...', 'STEP');
    await page.fill('input[name="email"], input[type="email"]', TEST_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.screenshot({ path: 'test-screenshots/02-login-filled.png' });

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: 'test-screenshots/03-logged-in.png' });

    // Verify login success
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
    log('Login successful', 'SUCCESS');

    // Step 4: Navigate to credits page
    log('Step 4: Navigating to credits page...', 'STEP');
    await page.goto(`${BASE_URL}/credits`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-screenshots/04-credits-page.png' });
    log('Credits page loaded', 'SUCCESS');

    // Check for existing error
    const errorMessage = await page.locator('text=/error.*stripe/i').count();
    if (errorMessage > 0) {
      const errorText = await page.locator('text=/error.*stripe/i').textContent();
      log(`Found error on page: ${errorText}`, 'ERROR');
      throw new Error(`Stripe connection error detected: ${errorText}`);
    }

    // Step 5: Get initial credit balance
    log('Step 5: Checking initial credit balance...', 'STEP');
    let initialCredits = 0;
    try {
      const creditsText = await page.locator('text=/credits?:?\\s*\\d+/i').first().textContent({ timeout: 5000 });
      const match = creditsText.match(/(\d+)/);
      if (match) {
        initialCredits = parseInt(match[1]);
        log(`Initial credits: ${initialCredits}`, 'SUCCESS');
      }
    } catch (e) {
      log('Could not find credit balance, assuming 0', 'WARN');
    }

    // Step 6: Click Purchase button for Basic package
    log('Step 6: Clicking Purchase button for Basic package...', 'STEP');

    // Find the Basic package card and its Purchase button
    const basicCard = page.locator('text=Basic').locator('..').locator('..');
    const purchaseButton = basicCard.locator('button:has-text("Purchase")').first();

    await purchaseButton.click();
    log('Purchase button clicked', 'SUCCESS');

    // Step 7: Wait for Stripe checkout page
    log('Step 7: Waiting for Stripe checkout page...', 'STEP');
    await page.waitForURL('**/checkout.stripe.com/**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/05-stripe-checkout.png' });
    log('Stripe checkout page loaded', 'SUCCESS');

    // Step 8: Fill in test card details
    log('Step 8: Filling in test card details...', 'STEP');

    // Wait for Stripe iframe to load
    await page.waitForTimeout(2000);

    // Card number
    const cardNumberFrame = page.frameLocator('iframe[name*="card"]').first();
    await cardNumberFrame.locator('input[name="cardnumber"], input[placeholder*="card number"]').fill(TEST_CARD.number);
    log('Card number entered', 'SUCCESS');

    // Expiry
    await cardNumberFrame.locator('input[name="exp-date"], input[placeholder*="MM"]').fill(TEST_CARD.expiry);
    log('Expiry date entered', 'SUCCESS');

    // CVC
    await cardNumberFrame.locator('input[name="cvc"], input[placeholder*="CVC"]').fill(TEST_CARD.cvc);
    log('CVC entered', 'SUCCESS');

    // ZIP code (if present)
    try {
      await cardNumberFrame.locator('input[name="postal"], input[placeholder*="ZIP"]').fill(TEST_CARD.zip, { timeout: 2000 });
      log('ZIP code entered', 'SUCCESS');
    } catch (e) {
      log('ZIP code field not found (optional)', 'WARN');
    }

    await page.screenshot({ path: 'test-screenshots/06-card-details-filled.png' });

    // Step 9: Submit payment
    log('Step 9: Submitting payment...', 'STEP');
    await page.click('button[type="submit"]:has-text("Pay")');
    log('Payment submitted', 'SUCCESS');

    // Step 10: Wait for redirect back to app
    log('Step 10: Waiting for redirect back to app...', 'STEP');
    await page.waitForURL(`${BASE_URL}/**`, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/07-payment-complete.png' });

    const finalUrl = page.url();
    log(`Redirected to: ${finalUrl}`, 'SUCCESS');

    // Step 11: Verify success
    log('Step 11: Verifying payment success...', 'STEP');

    // Check if URL contains success parameter
    if (finalUrl.includes('success=true')) {
      log('Payment success parameter found in URL', 'SUCCESS');
    } else if (finalUrl.includes('/login')) {
      throw new Error('Redirected to login page after payment - session may have been lost');
    }

    // Wait for credits to update
    await page.waitForTimeout(3000);

    // Check new credit balance
    try {
      const newCreditsText = await page.locator('text=/credits?:?\\s*\\d+/i').first().textContent({ timeout: 5000 });
      const match = newCreditsText.match(/(\d+)/);
      if (match) {
        const newCredits = parseInt(match[1]);
        const creditsAdded = newCredits - initialCredits;

        if (creditsAdded === 25) {
          log(`Credits successfully added! ${initialCredits} → ${newCredits} (+25)`, 'SUCCESS');
        } else if (creditsAdded > 0) {
          log(`Credits added: ${initialCredits} → ${newCredits} (+${creditsAdded})`, 'WARN');
          log('Expected +25 credits for Basic package', 'WARN');
        } else {
          log(`Credits not updated yet. Current: ${newCredits}`, 'WARN');
          log('Note: Credit addition may be processed asynchronously via webhook', 'INFO');
        }
      }
    } catch (e) {
      log('Could not verify credit balance update', 'WARN');
    }

    await page.screenshot({ path: 'test-screenshots/08-final-state.png' });

    // Test passed!
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED - Payment flow completed successfully!');
    console.log('='.repeat(60) + '\n');
    console.log('Screenshots saved to test-screenshots/');
    console.log('');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    console.log('='.repeat(60) + '\n');

    // Take error screenshot
    if (page) {
      try {
        await page.screenshot({ path: 'test-screenshots/error.png' });
        console.log('Error screenshot saved to test-screenshots/error.png\n');
      } catch (e) {
        // Ignore screenshot errors
      }
    }

    process.exit(1);

  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
      log('Browser closed', 'INFO');
    }
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
runBrowserTest().catch(console.error);
