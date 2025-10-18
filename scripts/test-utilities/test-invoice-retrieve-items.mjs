import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function testInvoiceRetrieveItems() {
  console.log('🧪 Testing invoice with pending items retrieval...\n');

  const customerEmail = '601404242@qq.com';

  try {
    // Find customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    const customer = customers.data[0];
    console.log(`✅ Customer: ${customer.id}\n`);

    // Skip preview for now, directly create invoice

    // Now create invoice
    console.log('\n📋 Creating invoice to capture pending items...');
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      description: 'Test Invoice - All Pending Items',
    });

    console.log(`✅ Invoice created: ${invoice.id}`);
    console.log(`   Subtotal: ${invoice.subtotal / 100} ${invoice.currency}`);
    console.log(`   Total: ${invoice.total / 100} ${invoice.currency}`);

    // Check what items are on the invoice
    const invoiceLineItems = await stripe.invoices.listLineItems(invoice.id);
    console.log(`   Line items: ${invoiceLineItems.data.length}`);
    invoiceLineItems.data.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.description}`);
      console.log(`      Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
    });

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type) console.error(`   Type: ${error.type}`);
  }
}

testInvoiceRetrieveItems().catch(console.error);
