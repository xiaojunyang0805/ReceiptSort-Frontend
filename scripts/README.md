# Scripts Directory

This directory contains utility scripts for development, testing, and debugging.

## Directory Structure

### `/debugging/`
**Purpose:** Emergency manual fix scripts (development only)

Manual fix scripts used during development to resolve issues:
- `add-10-credits.mjs` - Manually add 10 credits to a user (emergency fix)
- `add-credits-manual.js` - Manually add credits to user account
- `add-transaction-record.js` - Manually create transaction records
- `fix-current-payment.mjs` - Fix credits for payments before webhook was working

**⚠️ WARNING:** These are emergency scripts and should NOT be used in production.

### `/test-utilities/`
**Purpose:** Stripe invoice testing and diagnostic scripts

Testing and diagnostic scripts for Stripe integration:
- `check-invoice-details.mjs` - Check detailed invoice information
- `check-invoice-email-status.mjs` - Verify invoice email sending status
- `check-invoices.mjs` - List recent invoices from Stripe
- `check-pending-invoice-items.mjs` - Check pending invoice items for a customer
- `check-profiles.mjs` - Check user profile data
- `check-schema.mjs` - Verify database schema
- `test-complete-workflow.mjs` - Test complete payment workflow
- `test-fresh-invoice.mjs` - Test invoice creation with new customer
- `test-invoice-creation.mjs` - Test invoice item and invoice creation
- `test-invoice-direct-items.mjs` - Test invoice with direct line items
- `test-invoice-retrieve-items.mjs` - Test retrieving pending items
- `test-invoice-with-param.mjs` - Test invoice with explicit linking (THE SOLUTION!)
- `test-stripe.js` - Test Stripe API connection

### `/legacy-utilities/`
**Purpose:** Historical validation scripts (pre-production)

Early development validation scripts:
- `apply-credit-transactions-migration.js` - Database migration script (already applied)
- `diagnose-auth.mjs` - Authentication diagnostics (superseded by current auth system)
- `validate-rls.mjs` - Row Level Security validation (initial setup complete)
- `validate-schema.mjs` - Database schema validation (initial setup complete)
- `validate-storage.mjs` - Supabase storage validation (initial setup complete)

**Note:** These scripts were used during initial development and are kept for historical reference only.

### Root Scripts
**Purpose:** Active development and i18n utilities

**Internationalization Scripts:**
- `add-account-billing-i18n.mjs` - Add account/billing translations
- `add-invoices-i18n.mjs` - Add invoice page translations
- `add-missing-translations.mjs` - Batch add missing translation keys
- `add-profile-edit-i18n.mjs` - Add profile edit translations
- `add-upload-button-translation.mjs` - Add upload button translations
- `fix-receiptspage-translations.mjs` - Fix receipt page translation structure

**Stripe Testing Scripts:**
- `check-invoice-events.mjs` - Analyze webhook events for invoices
- `check-recent-invoice.mjs` - Quick check of most recent invoice
- `check-webhook-event.mjs` - Check specific webhook event
- `fix-stuck-invoice.mjs` - Fix invoice with incorrect status/amount
- `get-live-prices.mjs` - Retrieve live mode price IDs from Stripe
- `update-stripe-env.mjs` - Update Stripe environment variables in Vercel

## Usage

### Running Stripe Test Scripts

All `.mjs` scripts require a `.env.local` file with Stripe credentials:

```bash
# Check recent invoice
node scripts/check-recent-invoice.mjs

# Test invoice creation
node scripts/test-utilities/test-complete-workflow.mjs

# Get live mode prices
node scripts/get-live-prices.mjs
```

### Running i18n Scripts

```bash
# Add missing translations
node scripts/add-missing-translations.mjs

# Fix receipt page translations
node scripts/fix-receiptspage-translations.mjs
```

## Environment Requirements

Most scripts require these environment variables in `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Important Notes

- **Test vs Live Mode:** Test scripts use TEST MODE Stripe keys by default
- **Database Safety:** Always backup database before running manual fix scripts
- **Legacy Scripts:** Scripts in `legacy-utilities/` are historical and should not be run
- **Production Use:** Only `get-live-prices.mjs` and `update-stripe-env.mjs` are safe for production

## Related Documentation

- `../tests/README.md` - Automated test suite
- `../docs/stripe-setup/` - Stripe integration documentation
- `../Dev_note_02.md` - Payment testing history and solutions

---

**Last Updated:** 2025-10-19
**Total Scripts:** 29 (6 i18n, 6 testing, 4 debugging, 13 test-utilities, 5 legacy)
