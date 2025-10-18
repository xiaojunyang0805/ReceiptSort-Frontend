import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function checkInvoices() {
  console.log('🔍 Checking recent Stripe invoices...\n');

  const invoices = await stripe.invoices.list({ limit: 5 });

  if (invoices.data.length === 0) {
    console.log('No invoices found in Stripe');
    return;
  }

  invoices.data.forEach((inv, i) => {
    console.log(`${i + 1}. Invoice: ${inv.number || inv.id}`);
    console.log(`   Status: ${inv.status}`);
    console.log(`   Customer Email: ${inv.customer_email}`);
    console.log(`   Amount: ${inv.currency.toUpperCase()} ${inv.amount_due / 100}`);
    console.log(`   Created: ${new Date(inv.created * 1000).toLocaleString()}`);
    console.log(`   PDF: ${inv.invoice_pdf || 'N/A'}`);
    console.log(`   Hosted URL: ${inv.hosted_invoice_url || 'N/A'}`);
    console.log('');
  });
}

checkInvoices().catch(console.error);
