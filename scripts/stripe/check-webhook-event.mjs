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

async function checkRecentEvents() {
  try {
    console.log('\n=== Checking Recent Webhook Events ===\n');

    // Get recent events
    const events = await stripe.events.list({
      limit: 20,
      types: ['checkout.session.completed', 'invoice.finalized', 'invoice.paid'],
    });

    console.log(`Found ${events.data.length} recent events:\n`);

    for (const event of events.data) {
      console.log(`Event: ${event.type}`);
      console.log(`ID: ${event.id}`);
      console.log(`Created: ${new Date(event.created * 1000).toLocaleString()}`);

      if (event.type === 'checkout.session.completed') {
        console.log(`Session ID: ${event.data.object.id}`);
        console.log(`Customer Email: ${event.data.object.customer_email}`);
        console.log(`Amount: $${(event.data.object.amount_total / 100).toFixed(2)}`);
      }

      if (event.type === 'invoice.finalized' || event.type === 'invoice.paid') {
        console.log(`Invoice ID: ${event.data.object.id}`);
        console.log(`Invoice Status: ${event.data.object.status}`);
        console.log(`Amount: $${(event.data.object.amount_paid / 100).toFixed(2)}`);
      }

      console.log('---\n');
    }

    // Check the latest invoice that's stuck in "open" status
    console.log('\n=== Checking Problem Invoice ===\n');
    const invoice = await stripe.invoices.retrieve('in_1SJiSG2Q25JDcEYXEN6rBAIC');

    console.log(`Invoice ID: ${invoice.id}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Collection Method: ${invoice.collection_method}`);
    console.log(`Auto Advance: ${invoice.auto_advance}`);
    console.log(`Amount Due: $${(invoice.amount_due / 100).toFixed(2)}`);
    console.log(`Amount Paid: $${(invoice.amount_paid / 100).toFixed(2)}`);
    console.log(`Metadata:`, invoice.metadata);

    console.log('\n=== Attempting to Fix Invoice ===\n');

    try {
      // Try to finalize the invoice
      console.log('Step 1: Finalizing invoice...');
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      console.log(`✓ Invoice finalized. Status: ${finalizedInvoice.status}`);
      console.log(`  Amount Due: $${(finalizedInvoice.amount_due / 100).toFixed(2)}`);

      // Try to mark as paid
      console.log('\nStep 2: Marking invoice as paid (out of band)...');
      const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
        paid_out_of_band: true,
        forgive: true,
      });
      console.log(`✓ Invoice marked as paid. Status: ${paidInvoice.status}`);
      console.log(`  Amount Paid: $${(paidInvoice.amount_paid / 100).toFixed(2)}`);
      console.log(`  PDF URL: ${paidInvoice.invoice_pdf}`);

      console.log('\n✓ Invoice fixed successfully!');

    } catch (fixError) {
      console.error('Error fixing invoice:', fixError.message);
      if (fixError.raw) {
        console.error('Raw error:', JSON.stringify(fixError.raw, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

checkRecentEvents();
