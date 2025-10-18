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

async function checkRecentInvoice() {
  try {
    console.log('\n=== Checking Recent Invoices ===\n');

    // Get most recent invoices
    const invoices = await stripe.invoices.list({
      limit: 5,
    });

    if (invoices.data.length === 0) {
      console.log('No invoices found.');
      return;
    }

    console.log(`Found ${invoices.data.length} recent invoice(s):\n`);

    for (const invoice of invoices.data) {
      console.log(`Invoice ID: ${invoice.id}`);
      console.log(`Number: ${invoice.number}`);
      console.log(`Customer: ${invoice.customer_email || invoice.customer}`);
      console.log(`Amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
      console.log(`Status: ${invoice.status}`);
      console.log(`Created: ${new Date(invoice.created * 1000).toLocaleString()}`);
      console.log(`PDF URL: ${invoice.invoice_pdf || 'Not available yet'}`);
      console.log(`Hosted URL: ${invoice.hosted_invoice_url || 'Not available'}`);
      console.log(`Collection Method: ${invoice.collection_method}`);

      // Check metadata
      if (invoice.metadata && Object.keys(invoice.metadata).length > 0) {
        console.log(`Metadata:`, invoice.metadata);
      }

      // Check if invoice has line items
      if (invoice.lines && invoice.lines.data.length > 0) {
        console.log(`Line Items:`);
        invoice.lines.data.forEach(item => {
          console.log(`  - ${item.description}: $${(item.amount / 100).toFixed(2)}`);
        });
      }

      console.log('---\n');
    }

    // Check most recent checkout session
    console.log('\n=== Checking Recent Checkout Sessions ===\n');
    const sessions = await stripe.checkout.sessions.list({
      limit: 3,
    });

    if (sessions.data.length > 0) {
      const latestSession = sessions.data[0];
      console.log(`Latest Session ID: ${latestSession.id}`);
      console.log(`Customer Email: ${latestSession.customer_email}`);
      console.log(`Amount: $${(latestSession.amount_total / 100).toFixed(2)}`);
      console.log(`Status: ${latestSession.status}`);
      console.log(`Payment Status: ${latestSession.payment_status}`);
      console.log(`Created: ${new Date(latestSession.created * 1000).toLocaleString()}`);

      if (latestSession.metadata) {
        console.log(`Metadata:`, latestSession.metadata);
      }

      // Check if invoice was created for this session
      if (latestSession.invoice) {
        console.log(`\nInvoice created for this session: ${latestSession.invoice}`);

        // Fetch the invoice details
        const sessionInvoice = await stripe.invoices.retrieve(latestSession.invoice);
        console.log(`Invoice Status: ${sessionInvoice.status}`);
        console.log(`Invoice PDF: ${sessionInvoice.invoice_pdf || 'Not generated yet'}`);
      } else {
        console.log(`\nNo invoice linked to this checkout session.`);
      }
    }

  } catch (error) {
    console.error('Error checking invoices:', error.message);
  }
}

checkRecentInvoice();
