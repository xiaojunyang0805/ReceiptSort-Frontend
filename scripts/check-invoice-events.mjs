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

async function checkInvoiceEvents() {
  try {
    const invoiceId = 'in_1SJiin2Q25JDcEYXT1co8jlu'; // Latest invoice RPB5YKBM-0009

    console.log(`\n=== Checking Events for Invoice ${invoiceId} ===\n`);

    // Get all events related to this invoice
    const events = await stripe.events.list({
      limit: 100,
    });

    const invoiceEvents = events.data.filter(event => {
      const obj = event.data.object;
      return obj.id === invoiceId ||
             (obj.invoice && obj.invoice === invoiceId);
    });

    console.log(`Found ${invoiceEvents.length} events for this invoice:\n`);

    for (const event of invoiceEvents) {
      console.log(`Event Type: ${event.type}`);
      console.log(`Event ID: ${event.id}`);
      console.log(`Created: ${new Date(event.created * 1000).toLocaleString()}`);

      if (event.type === 'invoice.paid') {
        console.log(`  -> Invoice was marked as PAID`);
      }
      if (event.type === 'invoice.finalized') {
        console.log(`  -> Invoice was finalized`);
      }
      if (event.type === 'invoice.payment_succeeded') {
        console.log(`  -> Payment succeeded for invoice`);
      }

      console.log('---\n');
    }

    // Check the invoice details
    console.log('\n=== Invoice Details ===\n');
    const invoice = await stripe.invoices.retrieve(invoiceId);

    console.log(`Invoice ID: ${invoice.id}`);
    console.log(`Number: ${invoice.number}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Collection Method: ${invoice.collection_method}`);
    console.log(`Amount Paid: $${(invoice.amount_paid / 100).toFixed(2)}`);
    console.log(`Auto Advance: ${invoice.auto_advance}`);
    console.log(`PDF: ${invoice.invoice_pdf}`);

    // Check if invoice was sent
    console.log(`\n=== Email Status ===`);
    console.log(`Status Transitions:`);
    if (invoice.status_transitions) {
      console.log(`  - Finalized at: ${invoice.status_transitions.finalized_at ? new Date(invoice.status_transitions.finalized_at * 1000).toLocaleString() : 'Not finalized'}`);
      console.log(`  - Paid at: ${invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toLocaleString() : 'Not paid'}`);
      console.log(`  - Marked uncollectible at: ${invoice.status_transitions.marked_uncollectible_at ? new Date(invoice.status_transitions.marked_uncollectible_at * 1000).toLocaleString() : 'N/A'}`);
      console.log(`  - Voided at: ${invoice.status_transitions.voided_at ? new Date(invoice.status_transitions.voided_at * 1000).toLocaleString() : 'N/A'}`);
    }

    // Try to manually send the invoice
    console.log(`\n=== Attempting to Send Invoice Email ===\n`);

    try {
      const sentInvoice = await stripe.invoices.sendInvoice(invoiceId);
      console.log(`✓ Invoice email sent successfully!`);
      console.log(`  Invoice ID: ${sentInvoice.id}`);
      console.log(`  Status: ${sentInvoice.status}`);
    } catch (sendError) {
      console.log(`✗ Cannot send invoice email:`);
      console.log(`  Error: ${sendError.message}`);

      if (sendError.message.includes('paid') || sendError.message.includes('finalized')) {
        console.log(`\n  Note: Invoice emails cannot be sent for already-paid invoices.`);
        console.log(`  Stripe should have sent the email automatically when the invoice was marked as paid.`);
        console.log(`\n  Possible reasons for no email:`);
        console.log(`  1. "Send finalized invoices" setting is disabled in Dashboard`);
        console.log(`  2. Invoice was marked as paid using paid_out_of_band (emails may not send)`);
        console.log(`  3. Email was sent but blocked by recipient's email provider`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkInvoiceEvents();
