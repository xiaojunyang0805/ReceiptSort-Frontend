#!/usr/bin/env node
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Error: STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
});

async function fixStuckInvoice() {
  const invoiceId = 'in_1SJiSG2Q25JDcEYXEN6rBAIC';

  try {
    console.log(`\n=== Fixing Invoice ${invoiceId} ===\n`);

    // Get current invoice status
    const invoice = await stripe.invoices.retrieve(invoiceId);
    console.log(`Current Status: ${invoice.status}`);
    console.log(`Amount Due: $${(invoice.amount_due / 100).toFixed(2)}`);
    console.log(`Amount Paid: $${(invoice.amount_paid / 100).toFixed(2)}`);

    // Invoice is already finalized, just need to mark as paid
    if (invoice.status === 'open') {
      console.log('\nMarking invoice as paid (out of band)...');

      const paidInvoice = await stripe.invoices.pay(invoiceId, {
        paid_out_of_band: true,
      });

      console.log('\n✅ Invoice fixed!');
      console.log(`Status: ${paidInvoice.status}`);
      console.log(`Amount Paid: $${(paidInvoice.amount_paid / 100).toFixed(2)}`);
      console.log(`PDF URL: ${paidInvoice.invoice_pdf}`);
      console.log(`\nInvoice PDF: ${paidInvoice.invoice_pdf}`);
      console.log('\nCustomer should receive email with invoice now.');
    } else {
      console.log(`\nInvoice is already in status: ${invoice.status}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.raw) {
      console.error('Details:', error.raw.message);
    }
  }
}

fixStuckInvoice();
