import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function testInvoiceWithParam() {
  console.log('🧪 Testing invoice creation with invoice parameter...\n');

  const customerEmail = 'test-' + Date.now() + '@example.com';

  try {
    // 1. Create brand new customer
    console.log('👤 Creating new test customer...');
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: 'Fresh Test User',
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // 2. Create draft invoice FIRST
    console.log('📋 Creating draft invoice...');
    const invoice = await stripe.invoices.create({
      customer: customer.id,
    });
    console.log(`✅ Draft invoice created: ${invoice.id}\n`);

    // 3. Create invoice item LINKED to the invoice
    console.log('📝 Creating invoice item linked to invoice...');
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,  // Link directly to invoice!
      amount: 999,
      currency: 'eur',
      description: 'Test Item - 9.99 EUR',
    });
    console.log(`✅ Invoice item created: ${invoiceItem.id}\n`);

    // 4. Retrieve invoice to see if it now has items
    console.log('📋 Retrieving invoice...');
    const updatedInvoice = await stripe.invoices.retrieve(invoice.id);

    console.log(`   Subtotal: ${updatedInvoice.subtotal / 100} ${updatedInvoice.currency}`);
    console.log(`   Total: ${updatedInvoice.total / 100} ${updatedInvoice.currency}\n`);

    // 5. Check line items
    const lineItems = await stripe.invoices.listLineItems(updatedInvoice.id);
    console.log(`📦 Line items: ${lineItems.data.length}`);
    lineItems.data.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.description}`);
      console.log(`      Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
    });

    if (lineItems.data.length > 0) {
      console.log('\n✅ SUCCESS! Invoice includes line items when explicitly linked!');
      console.log('\n🎯 This is the solution: create invoice first, then link items to it.');
    } else {
      console.log('\n⚠️  FAIL: Still no line items');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type) console.error(`   Type: ${error.type}`);
  }
}

testInvoiceWithParam().catch(console.error);
