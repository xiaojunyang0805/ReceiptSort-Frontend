import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function checkInvoiceEmailStatus() {
  console.log('🔍 Checking invoice email status...\n');

  // Get the most recent invoice
  const invoices = await stripe.invoices.list({
    limit: 1
  });

  if (invoices.data.length === 0) {
    console.log('No invoices found');
    return;
  }

  const invoice = invoices.data[0];

  console.log('Most Recent Invoice:');
  console.log('===================');
  console.log('Invoice Number:', invoice.number);
  console.log('Invoice ID:', invoice.id);
  console.log('Status:', invoice.status);
  console.log('Customer Email:', invoice.customer_email);
  console.log('Amount:', invoice.amount_due / 100, invoice.currency.toUpperCase());
  console.log('');
  console.log('Email Status:');
  console.log('-------------');
  console.log('Auto Advance:', invoice.auto_advance);
  console.log('Collection Method:', invoice.collection_method);

  // Check if invoice has been sent
  // For send_invoice collection method, check if it was sent
  if (invoice.status === 'open' || invoice.status === 'paid') {
    console.log('Invoice Finalized:', invoice.status !== 'draft');
  }

  // Check events related to this invoice
  console.log('');
  console.log('Checking invoice events...');
  const events = await stripe.events.list({
    limit: 20,
    types: ['invoice.sent', 'invoice.finalized', 'invoice.paid'],
  });

  const invoiceEvents = events.data.filter(e => {
    const obj = e.data.object;
    return obj.id === invoice.id;
  });

  if (invoiceEvents.length > 0) {
    console.log(`Found ${invoiceEvents.length} events for this invoice:`);
    invoiceEvents.forEach(evt => {
      console.log(`  - ${evt.type} at ${new Date(evt.created * 1000).toLocaleString()}`);
    });
  } else {
    console.log('No events found for this invoice (invoice.sent, invoice.finalized, invoice.paid)');
  }

  console.log('');
  console.log('PDF URL:', invoice.invoice_pdf || 'N/A');
  console.log('Hosted URL:', invoice.hosted_invoice_url || 'N/A');

  // Note about test mode
  console.log('');
  console.log('⚠️  IMPORTANT: Email sending in Stripe test mode');
  console.log('   - Stripe does NOT actually send emails in test mode by default');
  console.log('   - You can view the invoice PDF using the URL above');
  console.log('   - To receive test emails, you may need to configure test mode email settings');
  console.log('   - Or use Stripe CLI to forward events to a local webhook');
}

checkInvoiceEmailStatus().catch(console.error);
