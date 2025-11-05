# ReceiptSort Test Suite

Comprehensive automated testing for the ReceiptSort payment and invoice workflow.

## 🧪 Available Tests

### 1. Quick Diagnostic Test
**File:** `quick-test.js`
**Purpose:** Fast (2 seconds) diagnostic tool to identify common issues
**Usage:**
```bash
node tests/quick-test.js
```

**Tests:**
- ✅ Environment variable validation
- ✅ Stripe API connection
- ✅ Price retrieval and validation
- ✅ Test vs Live mode mismatch detection
- ✅ Checkout session creation

### 2. Full Payment Flow Test
**File:** `payment-flow.test.js`
**Purpose:** Complete backend testing suite (10 seconds)
**Usage:**
```bash
node tests/payment-flow.test.js

# Or with specific environment
TEST_ENV=production node tests/payment-flow.test.js
```

**Tests:**
- ✅ All quick test features
- ✅ Invoice creation and finalization
- ✅ API endpoint connectivity
- ✅ Comprehensive error reporting
- ✅ Environment variable validation

### 3. Automated Browser Test (NEW!)
**File:** `browser-payment-test.js`
**Purpose:** End-to-end browser automation testing with Playwright
**Usage:**
```bash
# Headless mode (default)
node tests/browser-payment-test.js

# With visible browser (for debugging)
HEADLESS=false node tests/browser-payment-test.js

# Test local development
BASE_URL=http://localhost:3000 HEADLESS=false node tests/browser-payment-test.js
```

**Tests:**
- ✅ Browser automation
- ✅ Login flow
- ✅ Navigation to credits page
- ✅ Click Purchase button
- ✅ Stripe checkout page loads
- ✅ Fill test card details
- ✅ Submit payment
- ✅ Verify redirect
- ✅ Verify credit balance update
- 📸 Screenshots at each step

**Screenshots:** Saved to `test-screenshots/` directory:
- `01-login-page.png` - Login page
- `02-login-filled.png` - Credentials entered
- `03-logged-in.png` - After successful login
- `04-credits-page.png` - Credits page
- `05-stripe-checkout.png` - Stripe checkout
- `06-card-details-filled.png` - Test card entered
- `07-payment-complete.png` - After payment
- `08-final-state.png` - Final credits balance
- `error.png` - If test fails

## 🚀 Quick Start

### Run All Tests
```bash
# Backend tests
node tests/quick-test.js && node tests/payment-flow.test.js

# Full end-to-end with browser
node tests/browser-payment-test.js
```

### Prerequisites
```bash
# Install Playwright browsers (one-time setup)
npx playwright install chromium

# Install dependencies
npm install
```

## 📋 Test Results

### Local Environment
```
✅ All tests passing
✅ Stripe API connection: Working
✅ Price retrieval: Working
✅ Checkout creation: Working
```

### Production Environment
After running `bash scripts/fix-vercel-env.sh`:
```
✅ All environment variables configured
✅ Deployment triggered
⏳ Waiting for deployment...
```

## 🔍 Debugging

### Test Failed - Environment Variables
```bash
node tests/quick-test.js
# Look for warnings about missing or mismatched variables
```

### Test Failed - Stripe Connection
```bash
# Check Stripe key is valid
echo $STRIPE_SECRET_KEY

# Verify it starts with sk_test_ (test mode) or sk_live_ (live mode)
```

### Test Failed - Browser Test
```bash
# Run with visible browser to see what's happening
HEADLESS=false node tests/browser-payment-test.js

# Check screenshots in test-screenshots/
ls -la test-screenshots/
```

## 📊 Environment Variables

### Required
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_PRICE_STARTER` - Starter package price ID
- `STRIPE_PRICE_BASIC` - Basic package price ID
- `STRIPE_PRICE_PRO` - Pro package price ID
- `STRIPE_PRICE_BUSINESS` - Business package price ID

### Optional (for browser tests)
- `BASE_URL` - Default: `https://receiptsort.vercel.app`
- `TEST_EMAIL` - Default: `601404242@qq.com`
- `TEST_PASSWORD` - Default: `6163418`
- `HEADLESS` - Default: `true` (set to `false` to see browser)

## 🎭 Playwright MCP Setup

For Claude Code integration:

### 1. Install globally
```bash
npm install -g @executeautomation/playwright-mcp-server
```

### 2. Configure VS Code settings
Add to `settings.json`:
```json
{
  "mcp.servers": {
    "playwright": {
      "command": "playwright-mcp-server",
      "args": []
    }
  }
}
```

### 3. Restart VS Code
After adding the configuration, reload VS Code window.

## 🔄 CI/CD Integration

GitHub Actions workflow runs automatically on:
- Push to main branch
- Pull requests
- Manual trigger

Workflow file: `.github/workflows/payment-tests.yml`

## 📝 Test Coverage

| Component | Quick Test | Full Test | Browser Test |
|-----------|------------|-----------|--------------|
| Env Vars | ✅ | ✅ | ✅ |
| Stripe API | ✅ | ✅ | ✅ |
| Prices | ✅ | ✅ | ✅ |
| Checkout | ✅ | ✅ | ✅ |
| Invoice | ❌ | ✅ | ❌ |
| Browser UI | ❌ | ❌ | ✅ |
| Login Flow | ❌ | ❌ | ✅ |
| Purchase Flow | ❌ | ❌ | ✅ |
| Credit Update | ❌ | ❌ | ✅ |
| Screenshots | ❌ | ❌ | ✅ |

## 🆘 Common Issues

### Issue: "STRIPE_PRICE_* not set"
**Solution:** Run `bash scripts/fix-vercel-env.sh`

### Issue: "Connection to Stripe error"
**Solution:** Check for test/live key mismatch: `node tests/quick-test.js`

### Issue: "Browser test stuck on login"
**Solution:** Check credentials in environment variables

### Issue: "Credits not updated after payment"
**Solution:** Webhook may not be configured - credits are added asynchronously

## 📚 Documentation

- [Payment Testing Guide](../PAYMENT_TESTING_GUIDE.md) - Comprehensive debugging guide
- [Stripe Automation](../.claude/STRIPE_AUTOMATION.md) - Stripe API workflows

## 🤖 Automation

All tests can be automated through:
- GitHub Actions (CI/CD)
- Playwright MCP (Claude Code integration)
- Manual scripts (node tests/*.js)

---

**Last Updated:** 2025-10-18
**Status:** All test suites operational ✅
