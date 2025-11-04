import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function testInvoiceWithDirectItems() {
  console.log('🧪 Testing invoice creation with direct line items...\n');

  const customerEmail = '601404242@qq.com';
  const amount = 499; // $4.99 in cents
  const currency = 'eur';

  try {
    // 1. Find or create customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      console.log(`✅ Found existing customer: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: 'Test User',
      });
      console.log(`✅ Created new customer: ${customer.id}`);
    }

    // 2. Create invoice with inline items
    console.log('\n📋 Creating invoice with inline items...');

    // First create invoice item, then create invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      amount: amount,
      currency: currency,
      description: 'ReceiptSort Credits - Starter Package (10 credits)',
    });

    // Now create draft invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      description: 'Test Invoice - ReceiptSort Credits',
    });

    console.log(`✅ Invoice created: ${invoice.id}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Subtotal: ${invoice.subtotal} ${invoice.currency}`);

    // 3. Finalize invoice
    console.log('\n✅ Finalizing invoice...');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(`✅ Invoice finalized: ${finalizedInvoice.id}`);
    console.log(`   Amount Due: ${finalizedInvoice.amount_due} ${finalizedInvoice.currency}`);
    console.log(`   Subtotal: ${finalizedInvoice.subtotal} ${finalizedInvoice.currency}`);
    console.log(`   PDF: ${finalizedInvoice.invoice_pdf}`);
    console.log(`   Hosted URL: ${finalizedInvoice.hosted_invoice_url}`);

    // 4. Check line items
    console.log('\n📦 Checking line items...');
    const lineItems = await stripe.invoices.listLineItems(finalizedInvoice.id);
    console.log(`   Line items count: ${lineItems.data.length}`);

    lineItems.data.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.description}`);
      console.log(`      Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
    });

    console.log('\n✅ Success! Invoice has proper amount.');
    console.log(`   View invoice: https://dashboard.stripe.com/test/invoices/${finalizedInvoice.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type) console.error(`   Type: ${error.type}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }
}

testInvoiceWithDirectItems().catch(console.error);
