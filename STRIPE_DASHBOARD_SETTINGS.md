# Stripe Dashboard Settings for Invoice Emails

## Required Settings for Automated Invoice Emails

To ensure customers receive invoice emails after purchasing credits, you must configure these settings in your Stripe Dashboard:

### 1. Enable Successful Payment Emails ✅ CRITICAL

**Path:** Settings → Customer emails → Payments section

**Direct URL:** https://dashboard.stripe.com/settings/emails

**Steps:**
1. Go to https://dashboard.stripe.com/settings/emails
2. Scroll to **"Payments"** section
3. Toggle ON: **"Successful payments"**
4. Description shown: "This setting is ignored when you create a payment in the API and provide the receipt_email parameter."

**What this does:**
- Sends receipt emails for all successful checkout payments
- Email includes payment receipt
- Invoice PDF automatically attached (if invoice was created)
- VAT information from invoice footer included

**Status:** ✅ This is already enabled in your dashboard (as shown in screenshot)

---

### 2. Enable Finalized Invoice Emails ✅ CRITICAL

**Path:** Settings → Billing → Subscriptions → Manage invoices sent to customers

**Direct URL:** https://dashboard.stripe.com/settings/billing/subscriptions

**Steps:**
1. Go to https://dashboard.stripe.com/settings/billing/subscriptions
2. Scroll down to **"Manage invoices sent to customers"** section
3. Under **"Customer emails"**, toggle ON: **"Send finalized invoices and credit notes to customers"**
4. (Optional) Toggle OFF: "Send reminders if a recurring invoice hasn't been paid" - not needed for one-time credit purchases

**What this does:**
- Sends invoice emails when invoices are finalized
- Includes invoice PDF with VAT footer
- Confirms invoice creation to customer

**Status:** ✅ This is already enabled in your dashboard (as shown in screenshot)

**Important Note:**
The invoice email setting is NOT under "Settings → Customer emails" as many guides suggest. Stripe shows this message on the emails page:
> "To manage emails about invoices, failed payments, and more, visit Billing settings"

The actual setting is under **Billing → Subscriptions**, NOT under Customer emails.

---

### 3. Configure Invoice Footer with VAT Information

**Path:** Settings → Billing → Invoices → Invoice template

**Direct URL:** https://dashboard.stripe.com/settings/billing/invoice

**Steps:**
1. Go to https://dashboard.stripe.com/settings/billing/invoice
2. Scroll to **"Invoice template"** or **"Default footer"** section
3. Add your VAT information in the footer field:
   ```
   SeeNano Technology B.V.
   KvK-nr. 84195908
   BTW-nr. NL 863128737B01
   ```
4. Click **"Save"**

**What this does:**
- This footer appears on ALL invoice PDFs
- Provides legally required VAT information for EU invoices
- Cannot be changed per-invoice (it's a default setting)

**Important:** Old invoices won't update with new footer. Only newly created invoices will have the updated footer.

---

### 4. Configure Business Information

**Path:** Settings → Public details (or Business information)

**Direct URL:** https://dashboard.stripe.com/settings/public

**Steps:**
1. Go to https://dashboard.stripe.com/settings/public
2. Fill in all required fields:
   - **Legal business name:** SeeNano Technology B.V.
   - **Business address:** [Your full business address]
   - **Tax ID / VAT number:** NL 863128737B01
   - **Support email:** [Your support email]
   - **Support phone:** [Your support phone]
3. Click **"Save changes"**

**What this does:**
- Business name appears on invoices and receipts
- Tax ID/VAT number shows on invoice PDFs
- Support contact info helps customers reach you
- Required for proper VAT compliance

---

## How the Complete Payment Flow Works

### User Journey:
1. Customer clicks **"Buy Credits"** button in ReceiptSort app
2. App calls `/api/credits/checkout` endpoint
3. Stripe Checkout Session created with price ID
4. Customer redirected to Stripe-hosted payment page
5. Customer enters credit card and pays
6. Stripe processes payment
7. Stripe redirects customer back to app with `?success=true`

### Backend Processing (Webhook):
1. **Webhook Event:** `checkout.session.completed` sent to `/api/stripe/webhook`
2. **Webhook Handler** (`handleCheckoutCompleted` function):
   - Verifies webhook signature
   - Extracts metadata: `user_id`, `package_id`, `credits`
   - Adds credits to user's account in database
   - Creates transaction record
   - Calls `createInvoiceRecord()` function
3. **Invoice Creation** (`createInvoiceRecord` function):
   - Creates or retrieves Stripe Customer
   - Creates draft invoice with `collection_method: 'charge_automatically'`
   - Adds invoice item with credit package description
   - Finalizes invoice (generates PDF with VAT footer)
   - Marks invoice as PAID using `paid_out_of_band: true`
   - Stores invoice record in database
4. **Stripe Email Automation:**
   - IF "Successful payments" is enabled → Stripe sends receipt email
   - IF "Send finalized invoices" is enabled → Stripe sends invoice email
   - Email includes invoice PDF attachment
   - PDF contains VAT footer from dashboard settings

### Email Content (sent by Stripe):
- **Subject:** "Receipt from SeeNano Technology B.V." or "Invoice from SeeNano Technology B.V."
- **Body:** Payment confirmation with details
- **Attachment:** Invoice PDF containing:
  - Invoice number (e.g., `INV-2025-0001`)
  - Amount paid
  - Payment date
  - Customer name and email
  - Item description: "ReceiptSort Credits - starter Package (10 credits)"
  - VAT footer with company details

---

## Testing Procedure

### Test Mode Testing:

1. **Switch to TEST mode** in Stripe Dashboard (toggle in top-right corner)
2. **Verify test email settings** are enabled:
   - Go to https://dashboard.stripe.com/test/settings/emails
   - Verify "Successful payments" is ON
   - Go to https://dashboard.stripe.com/test/settings/billing/subscriptions
   - Verify "Send finalized invoices" is ON
3. **Use test card:** `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any billing ZIP code (e.g., 12345)
4. **Complete test purchase** in your app
5. **Check test email inbox** for receipt/invoice email
6. **Verify invoice PDF** attachment includes:
   - Correct amount
   - VAT footer
   - "TEST MODE" watermark
7. **Check Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/invoices
   - Find the invoice
   - Status should be "Paid"
   - Download PDF to verify formatting

### Live Mode Testing:

⚠️ **WARNING:** Live mode uses real money. Only test after test mode works perfectly.

1. **Switch to LIVE mode** in Stripe Dashboard
2. **Verify live email settings** are enabled:
   - Go to https://dashboard.stripe.com/settings/emails
   - Verify "Successful payments" is ON
   - Go to https://dashboard.stripe.com/settings/billing/subscriptions
   - Verify "Send finalized invoices" is ON
3. **Verify live API keys** are set in Vercel production environment:
   - `STRIPE_SECRET_KEY` starts with `sk_live_`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
   - `STRIPE_WEBHOOK_SECRET` starts with `whsec_` (from live webhook endpoint)
4. **Verify live price IDs** are set:
   - All `STRIPE_PRICE_*` variables should start with `price_` (without `_test_`)
5. **Make small real purchase** ($4.99 Starter package recommended)
6. **Verify real email received** with invoice PDF
7. **Verify in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/invoices
   - Find the invoice (no TEST MODE watermark)
   - Status: "Paid"
   - Download and verify PDF

---

## Troubleshooting

### Problem: No Email Received

**Checklist:**
1. ✅ Check Stripe Dashboard → Settings → Customer emails
   - "Successful payments" must be ON
2. ✅ Check Stripe Dashboard → Settings → Billing → Subscriptions
   - "Send finalized invoices and credit notes to customers" must be ON
3. ✅ Check spam/junk/promotions folder in email
4. ✅ Verify customer email is correct in Stripe Dashboard → Customers
5. ✅ Check if webhook succeeded:
   - Go to https://dashboard.stripe.com/webhooks
   - Find your webhook endpoint
   - Click on it → View events
   - Find recent `checkout.session.completed` event
   - Status should be "Succeeded" (green checkmark)
6. ✅ Check Vercel logs for errors:
   - Go to Vercel project → Logs
   - Filter for `/api/stripe/webhook`
   - Look for errors in invoice creation

**Common Causes:**
- Dashboard email settings not enabled
- Webhook failed (check webhook logs in Stripe)
- Invoice creation failed (check Vercel logs)
- Email marked as spam by email provider

---

### Problem: No Invoice PDF Attached

**Checklist:**
1. ✅ Wait 1-2 minutes - PDF generation is asynchronous
2. ✅ Check invoice was created:
   - Stripe Dashboard → Invoices
   - Search for customer email or recent date
3. ✅ Verify invoice status is **"Paid"** (not Draft, not Open)
4. ✅ Check invoice has items:
   - Click on invoice
   - Should show credit package line item
   - Should show amount
5. ✅ Download PDF manually from dashboard to verify it exists

**Common Causes:**
- PDF generation still in progress (wait longer)
- Invoice not finalized (check code calls `finalizeInvoice()`)
- Invoice created but not marked as paid (check code calls `pay()` with `paid_out_of_band: true`)

---

### Problem: Invoice Shows "PAY THIS INVOICE" Button

**Checklist:**
1. ✅ Verify invoice `collection_method` is `'charge_automatically'` (NOT `'send_invoice'`)
2. ✅ Verify invoice status is "Paid" in Stripe Dashboard
3. ✅ Check code in `createInvoiceRecord()` function:
   ```typescript
   collection_method: 'charge_automatically',  // Prevents payment button
   ```
4. ✅ Verify invoice was marked as paid:
   ```typescript
   await stripe.invoices.pay(finalizedInvoice.id, {
     paid_out_of_band: true, // Cannot use both paid_out_of_band and forgive
   })
   ```

**Common Cause:**
Using `collection_method: 'send_invoice'` shows a payment button because Stripe thinks the customer still needs to pay. Since payment already happened via Checkout Session, we use `'charge_automatically'` to indicate payment is handled separately.

---

### Problem: Missing VAT Footer on Invoice PDF

**Checklist:**
1. ✅ Go to Settings → Billing → Invoices
2. ✅ Verify "Default footer" or "Invoice template" has VAT information
3. ✅ Create NEW invoice to test (old invoices don't update)
4. ✅ Download PDF from Stripe Dashboard → Invoices → [Select invoice] → Download

**Common Cause:**
Footer is a dashboard setting, not code-based. You must configure it in Stripe Dashboard. Old invoices won't retroactively update when you change the footer.

---

### Problem: Webhook Signature Verification Failed

**Error message:** `Webhook signature verification failed`

**Checklist:**
1. ✅ Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard
2. ✅ Get correct secret:
   - Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the value (starts with `whsec_`)
3. ✅ Update Vercel environment variable:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the whsec_... value
   ```
4. ✅ Redeploy application
5. ✅ Test webhook again

**Common Cause:**
Wrong webhook secret, or using test mode secret with live mode endpoint (or vice versa).

---

### Problem: "No such price" Error

**Error message:** `No such price: 'price_xxx'; a similar object exists in test mode, but a live mode key was used`

**Checklist:**
1. ✅ Verify API keys match price mode:
   - Test prices (`price_test_...`) require test keys (`sk_test_...`)
   - Live prices (normal `price_...`) require live keys (`sk_live_...`)
2. ✅ List all prices in current mode:
   ```bash
   node scripts/get-live-prices.mjs
   ```
3. ✅ Update environment variables with correct price IDs
4. ✅ Redeploy application

**Common Cause:**
Mixing test and live mode. All components must be in the same mode: API keys, webhook secrets, AND price IDs.

---

### Problem: Database Error When Storing Invoice

**Error message:** `Failed to store invoice record: { code: '22P02'... }`

**Cause:** PostgreSQL JSONB type mismatch when storing invoice metadata.

**Fix:** Ensure type casting in code:
```typescript
metadata: invoice.metadata as Record<string, unknown>,
```

**Check:** File `src/app/api/stripe/webhook/route.ts`, function `storeInvoiceRecord()`

---

## Important Notes

### About Email Delivery:
- ✅ **Emails are sent by Stripe**, not by your application code
- ✅ **Dashboard settings control everything** - code cannot override
- ✅ **Two separate settings required:**
  1. "Successful payments" (Settings → Customer emails)
  2. "Send finalized invoices" (Settings → Billing → Subscriptions)
- ✅ **Email delivery is NOT instant** - may take 1-2 minutes
- ✅ **PDF generation is asynchronous** - allow 30-60 seconds

### About Invoices:
- ✅ **Invoices are for record-keeping** - payment already happened via Checkout Session
- ✅ **Invoice shows "PAID" status** because we mark it with `paid_out_of_band: true`
- ✅ **Collection method matters:**
  - `'charge_automatically'` → No "Pay" button (correct for our use case)
  - `'send_invoice'` → Shows "Pay this invoice" button (WRONG for our use case)
- ✅ **VAT footer is a dashboard setting**, not controllable via API

### About Testing:
- ✅ **Test mode and live mode are completely separate:**
  - Separate customers
  - Separate invoices
  - Separate email settings
  - Separate price IDs
  - Separate webhook endpoints
- ✅ **Test mode emails may go to spam** more often than live mode
- ✅ **Always test in test mode first** before touching live mode

### About Webhooks:
- ✅ **Webhook signature verification is critical** for security
- ✅ **Webhook secrets are different** for test vs live mode
- ✅ **Webhook retries:** Stripe retries failed webhooks for up to 3 days
- ✅ **Check webhook logs** in Stripe Dashboard to debug delivery issues

---

## Stripe Dashboard Settings Checklist

Before going live, verify ALL these settings:

### Email Settings:
- [ ] Settings → Customer emails → "Successful payments" = ON
- [ ] Settings → Billing → Subscriptions → "Send finalized invoices and credit notes to customers" = ON

### Invoice Settings:
- [ ] Settings → Billing → Invoices → Invoice template footer includes VAT information
- [ ] Settings → Public details → Legal business name filled
- [ ] Settings → Public details → Tax ID / VAT number filled
- [ ] Settings → Public details → Support email filled

### Webhook Settings:
- [ ] Developers → Webhooks → Endpoint configured
- [ ] Endpoint URL: `https://your-domain.com/api/stripe/webhook`
- [ ] Events to send: `checkout.session.completed` (minimum required)
- [ ] Signing secret copied to Vercel environment variable

### Environment Variables (Vercel Production):
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from live webhook)
- [ ] `STRIPE_PRICE_STARTER` = `price_...` (live price ID)
- [ ] `STRIPE_PRICE_BASIC` = `price_...` (live price ID)
- [ ] `STRIPE_PRICE_PRO` = `price_...` (live price ID)
- [ ] `STRIPE_PRICE_BUSINESS` = `price_...` (live price ID)

### Products and Prices:
- [ ] All credit packages created as Products in Stripe Dashboard
- [ ] Each product has an active Price
- [ ] Prices are in correct mode (test vs live)
- [ ] Price IDs match environment variables

---

## Support and Debugging

### Stripe Dashboard Logs:
1. **Webhook events:** https://dashboard.stripe.com/webhooks → [Your endpoint] → Event deliveries
2. **API logs:** https://dashboard.stripe.com/logs
3. **Email logs:** Not available (Stripe doesn't log email delivery in dashboard)

### Application Logs:
1. **Vercel logs:** Vercel project → Logs → Filter by `/api/stripe/webhook`
2. **Browser console:** Check for JavaScript errors on payment page
3. **Network tab:** Verify API calls to `/api/credits/checkout` succeed

### If Emails Still Don't Work:
1. ✅ Verify both email settings are enabled (see checklist above)
2. ✅ Check spam folder thoroughly
3. ✅ Try different email address (Gmail, Outlook, etc.)
4. ✅ Verify webhook succeeded in Stripe Dashboard
5. ✅ Check Vercel logs for errors in invoice creation
6. ✅ Manually check invoice exists and is "Paid" in Stripe Dashboard
7. ✅ Contact Stripe support: https://support.stripe.com/contact

### Useful Stripe Documentation:
- Email settings: https://stripe.com/docs/receipts
- Invoice emails: https://stripe.com/docs/invoicing/send-email
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

---

## Summary

**For customers to receive invoice emails, you MUST:**

1. ✅ Enable "Successful payments" at: https://dashboard.stripe.com/settings/emails
2. ✅ Enable "Send finalized invoices" at: https://dashboard.stripe.com/settings/billing/subscriptions
3. ✅ Configure VAT footer at: https://dashboard.stripe.com/settings/billing/invoice
4. ✅ Configure business details at: https://dashboard.stripe.com/settings/public
5. ✅ Ensure webhook succeeds (check in Stripe Dashboard → Webhooks)
6. ✅ Ensure invoice is created and marked as "Paid" (check in Stripe Dashboard → Invoices)

**The code handles everything else automatically.** The webhook creates the invoice, finalizes it, marks it as paid, and stores it in the database. Stripe's email automation (controlled by dashboard settings) sends the email with PDF attachment.
