# Scripts Directory

This directory contains utility scripts for development, testing, and debugging.

## Directory Structure

### `/debugging/`
Manual fix scripts used during development to resolve issues:
- `add-10-credits.mjs` - Manually add 10 credits to a user (emergency fix)
- `add-credits-manual.js` - Manually add credits to user account
- `add-transaction-record.js` - Manually create transaction records
- `fix-current-payment.mjs` - Fix credits for payments before webhook was working

**Note**: These are emergency scripts and should not be needed in production.

### `/test-utilities/`
Testing and diagnostic scripts for Stripe integration:
- `check-invoice-details.mjs` - Check detailed invoice information
- `check-invoice-email-status.mjs` - Verify invoice email sending status
- `check-invoices.mjs` - List recent invoices from Stripe
- `check-pending-invoice-items.mjs` - Check pending invoice items for a customer
- `check-profiles.mjs` - Check user profile data
- `check-schema.mjs` - Verify database schema
- `test-fresh-invoice.mjs` - Test invoice creation with new customer
- `test-invoice-creation.mjs` - Test invoice item and invoice creation
- `test-invoice-direct-items.mjs` - Test invoice with direct line items
- `test-invoice-retrieve-items.mjs` - Test retrieving pending items
- `test-invoice-with-param.mjs` - Test invoice with explicit linking (THE SOLUTION!)
- `test-stripe.js` - Test Stripe API connection

### Root Scripts
Production and deployment utilities:
- `fix-env-newlines.sh` - Fix environment variable newline issues
- `fix-vercel-env.sh` - Fix Vercel environment variables
- `set-vercel-env.ps1` - PowerShell script to set Vercel env vars
- `update-stripe-env.mjs` - Update Stripe environment variables

## Usage

All `.mjs` scripts require a `.env.local` file with Stripe credentials:

```bash
node scripts/test-utilities/check-invoices.mjs
```

## Important Notes

- Test scripts use **TEST MODE** Stripe keys
- Debugging scripts should only be used in development
- Always backup database before running manual fix scripts
