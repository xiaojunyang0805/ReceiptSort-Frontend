import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function checkInvoiceDetails() {
  console.log('🔍 Checking invoice RPB5YKBM-0003 details...\n');

  // Get the most recent invoice
  const invoices = await stripe.invoices.list({
    limit: 1
  });

  if (invoices.data.length === 0) {
    console.log('No invoices found');
    return;
  }

  const invoice = invoices.data[0];

  console.log('Invoice Details:');
  console.log('================');
  console.log('Number:', invoice.number);
  console.log('Status:', invoice.status);
  console.log('Customer Email:', invoice.customer_email);
  console.log('Amount Due:', invoice.amount_due / 100, invoice.currency.toUpperCase());
  console.log('Amount Paid:', invoice.amount_paid / 100, invoice.currency.toUpperCase());
  console.log('Subtotal:', invoice.subtotal / 100, invoice.currency.toUpperCase());
  console.log('Total:', invoice.total / 100, invoice.currency.toUpperCase());
  console.log('');
  console.log('Email Settings:');
  console.log('Auto Advance:', invoice.auto_advance);
  console.log('Collection Method:', invoice.collection_method);
  console.log('');
  console.log('Line Items:');

  const lineItems = await stripe.invoices.listLineItems(invoice.id);
  if (lineItems.data.length === 0) {
    console.log('  ⚠️  NO LINE ITEMS! This is why the invoice is $0');
  } else {
    lineItems.data.forEach(item => {
      console.log(`  - ${item.description}`);
      console.log(`    Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
      console.log(`    Quantity: ${item.quantity}`);
    });
  }

  console.log('');
  console.log('Metadata:', invoice.metadata);
  console.log('');
  console.log('PDF URL:', invoice.invoice_pdf);
  console.log('Hosted URL:', invoice.hosted_invoice_url);
}

checkInvoiceDetails().catch(console.error);
