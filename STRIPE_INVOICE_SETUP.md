# Stripe Invoice-Based Payment System Setup Guide

## Overview

This guide will help you set up automatic invoice generation and sending in Stripe for your ReceiptSort application. This system is designed for VAT filing and automated invoice management.

## What's Been Implemented

### 1. Invoice-Based Payment Functions (`src/lib/stripe.ts`)

Added the following functions:

- **`createOrGetCustomer()`**: Creates or retrieves Stripe customer
- **`createHostedInvoice()`**: Creates invoice with hosted payment page (recommended)
- **`createInvoicePayment()`**: Creates and immediately pays invoice (alternative)
- **`retrieveInvoice()`**: Retrieves invoice by ID
- **`listCustomerInvoices()`**: Lists invoices for a customer
- **`sendInvoiceEmail()`**: Manually sends invoice email

### 2. Updated Checkout API (`src/app/api/credits/checkout/route.ts`)

The checkout API now supports two modes:

- **Invoice Mode** (default): `use_invoice: true`
  - Creates proper Stripe invoices
  - Generates invoice PDF
  - Auto-numbered invoices
  - Stored in Stripe database

- **Checkout Mode**: `use_invoice: false`
  - Original checkout session flow
  - No invoice generation

### 3. Enhanced Webhook Handler (`src/app/api/stripe/webhook/route.ts`)

Added handlers for:

- **`invoice.payment_succeeded`**: Adds credits when invoice is paid
- **`invoice.finalized`**: Stores invoice record in database
- **`invoice.paid`**: Updates invoice status

### 4. Database Schema (`supabase/migrations/20251015_create_invoices_table.sql`)

Created `invoices` table to store:

- Invoice ID and number
- Customer information
- Amount and currency
- Payment status
- PDF and hosted URLs
- Metadata
- Dates (created, due, paid)

### 5. Invoice Management Pages

**Invoice List Page**: `/invoices`
- View all invoices
- Download PDFs
- Export to CSV/JSON
- Filter by date and status

**Invoice Export API**: `/api/invoices/export`
- Export format: CSV or JSON
- Date range filtering
- VAT filing ready

## Setup Instructions

### Step 1: Run Database Migration

You need to create the `invoices` table in your Supabase database:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard:
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql-editor
# Copy and paste contents of: supabase/migrations/20251015_create_invoices_table.sql
```

### Step 2: Configure Stripe Dashboard for Automatic Invoice Emailing

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/

2. **Navigate to Settings → Emails**:
   - Click "Settings" in the left sidebar
   - Click "Emails" or "Customer emails"

3. **Enable Invoice Emails**:
   - Find "Invoices" section
   - Toggle ON: "Email customers when an invoice is created"
   - Toggle ON: "Email customers when an invoice is paid"

4. **Customize Invoice Settings** (Settings → Invoices):
   - Set invoice footer text (optional)
   - Add your company information
   - Configure invoice numbering (Stripe auto-numbers by default)

5. **Configure Invoice Branding** (Settings → Branding):
   - Upload your logo
   - Set brand colors
   - Add company address
   - Add tax ID (for VAT)

### Step 3: Update Stripe Webhook

Make sure your Stripe webhook is listening for invoice events:

1. Go to: https://dashboard.stripe.com/webhooks

2. Click on your webhook endpoint (should be: `https://receiptsort.vercel.app/api/stripe/webhook`)

3. **Add these events if not already added**:
   - `invoice.payment_succeeded`
   - `invoice.finalized`
   - `invoice.paid`
   - `checkout.session.completed` (existing)
   - `payment_intent.succeeded` (existing)

4. **Test the webhook**:
   - Click "Send test webhook"
   - Select `invoice.payment_succeeded`
   - Verify logs show successful handling

### Step 4: Configure Your Business Information in Stripe

For proper VAT invoices, configure:

1. **Settings → Business Information**:
   - Legal business name
   - Business address
   - Tax ID / VAT number
   - Phone number

2. **Settings → Tax Settings**:
   - Configure tax rates (if applicable)
   - Set up automatic tax collection (optional)

### Step 5: Test the Invoice Flow

1. **Test Purchase** (in test mode):
   ```bash
   # Make sure you're using test API keys
   # Use test card: 4242 4242 4242 4242
   ```

2. **Verify Invoice Creation**:
   - Check Stripe Dashboard → Invoices
   - Verify invoice PDF is generated
   - Check invoice email was sent

3. **Verify Database Storage**:
   - Check Supabase `invoices` table
   - Verify invoice record was created with all fields

4. **Verify Credits Added**:
   - Check user's credit balance increased
   - Check `credit_transactions` table

5. **Test Invoice Page**:
   - Visit: https://receiptsort.vercel.app/invoices
   - Verify invoices display correctly
   - Test PDF download
   - Test CSV export

## Usage

### For Customers

When customers purchase credits, they will:

1. See a Stripe-hosted invoice payment page
2. Pay with card, Apple Pay, Google Pay, etc.
3. Receive invoice email immediately upon payment
4. Access all invoices at `/invoices` page
5. Download PDFs anytime

### For You (VAT Filing)

To collect invoices for VAT filing:

1. **View All Invoices**:
   - Go to `/invoices` page
   - See all paid invoices with dates and amounts

2. **Export for Accounting**:
   - Click "Export CSV" to get spreadsheet
   - Import to your accounting software
   - Or use Stripe Dashboard → Invoices → Export

3. **Monthly VAT Filing**:
   ```
   # Example workflow:
   1. Go to /invoices
   2. Click "Export CSV"
   3. Filter by date range (e.g., November 2025)
   4. Import CSV into QuickBooks/Xero
   5. Use for VAT return filing
   ```

4. **Automated Collection** (Alternative):
   - Process exported invoices through ReceiptSort itself!
   - Upload invoice PDFs to ReceiptSort
   - Extract data automatically
   - Export to Excel for VAT filing

## Switching from Checkout to Invoice Mode

The system defaults to invoice mode (`use_invoice: true`). To revert:

```typescript
// In your frontend code (when calling checkout API):
const response = await fetch('/api/credits/checkout', {
  method: 'POST',
  body: JSON.stringify({
    package_id: 'basic',
    use_invoice: false  // Set to false for old checkout mode
  })
})
```

## API Documentation

### Checkout API

**Endpoint**: `POST /api/credits/checkout`

**Request Body**:
```json
{
  "package_id": "basic",
  "use_invoice": true  // Optional, defaults to true
}
```

**Response (Invoice Mode)**:
```json
{
  "url": "https://invoice.stripe.com/i/...",
  "invoiceId": "in_...",
  "paymentMode": "invoice"
}
```

**Response (Checkout Mode)**:
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_...",
  "paymentMode": "checkout"
}
```

### Invoice Export API

**Endpoint**: `GET /api/invoices/export`

**Query Parameters**:
- `format`: `csv` or `json` (default: `csv`)
- `start_date`: ISO date (optional)
- `end_date`: ISO date (optional)

**Example**:
```
GET /api/invoices/export?format=csv&start_date=2025-11-01&end_date=2025-11-30
```

## Troubleshooting

### Issue: Invoices not appearing in database

**Solution**:
1. Check webhook is receiving `invoice.finalized` event
2. Verify database migration ran successfully
3. Check Supabase logs for errors
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: Invoice emails not sending

**Solution**:
1. Check Stripe Dashboard → Settings → Emails
2. Verify "Email customers when invoice is created" is ON
3. Check spam folder
4. Verify customer email is valid

### Issue: Credits not added after payment

**Solution**:
1. Check webhook is receiving `invoice.payment_succeeded`
2. Verify invoice metadata contains `user_id` and `credits`
3. Check webhook logs in Vercel
4. Manually trigger webhook test

### Issue: Invoice PDF not generating

**Solution**:
1. Wait 1-2 minutes after payment (Stripe generates async)
2. Check Stripe Dashboard → Invoices
3. Verify invoice is finalized (not draft)
4. Try sending invoice email manually

## Next Steps

### Recommended Enhancements

1. **Email Notifications**:
   - Send custom email after purchase (in addition to Stripe email)
   - Include link to invoices page
   - Add receipt attachment

2. **Invoice Filtering**:
   - Add date range picker to `/invoices` page
   - Add status filters
   - Add amount range filters

3. **Automatic VAT Collection**:
   - Enable Stripe Tax
   - Automatic VAT calculation based on customer location
   - Compliance with EU/UK VAT rules

4. **Invoice Customization**:
   - Add custom fields to invoice metadata
   - Include project/PO numbers
   - Add customer notes

5. **Accounting Integration**:
   - Direct integration with QuickBooks API
   - Auto-sync invoices to Xero
   - Connect to accounting webhooks

## Support

If you encounter issues:

1. Check Stripe Dashboard → Developers → Logs
2. Check Vercel logs for webhook errors
3. Check Supabase logs for database errors
4. Review this document's troubleshooting section

## Files Modified

- `src/lib/stripe.ts` - Added invoice functions
- `src/app/api/credits/checkout/route.ts` - Invoice mode support
- `src/app/api/stripe/webhook/route.ts` - Invoice event handlers
- `src/app/[locale]/(dashboard)/invoices/page.tsx` - Invoice list page
- `src/app/api/invoices/export/route.ts` - Export API
- `src/components/dashboard/Sidebar.tsx` - Added invoices link
- `messages/en.json` - Added invoice translations
- `supabase/migrations/20251015_create_invoices_table.sql` - Database schema

## Summary

You now have a complete invoice-based payment system that:

✅ Generates proper Stripe invoices for all payments
✅ Automatically emails invoices to customers
✅ Stores invoices in your database
✅ Provides invoice management page
✅ Exports invoices for VAT filing
✅ Maintains full audit trail

The system is ready for production use once you complete the Stripe Dashboard configuration steps above.
