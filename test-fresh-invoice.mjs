import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function testFreshInvoice() {
  console.log('🧪 Testing fresh invoice creation...\n');

  const customerEmail = 'test-' + Date.now() + '@example.com';

  try {
    // 1. Create brand new customer
    console.log('👤 Creating new test customer...');
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: 'Fresh Test User',
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // 2. Create invoice item
    console.log('📝 Creating invoice item...');
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      amount: 999,
      currency: 'eur',
      description: 'Test Item - 9.99 EUR',
    });
    console.log(`✅ Invoice item created: ${invoiceItem.id}\n`);

    // 3. Create invoice immediately (without collection_method to allow defaults)
    console.log('📋 Creating invoice...');
    const invoice = await stripe.invoices.create({
      customer: customer.id,
    });

    console.log(`✅ Invoice created: ${invoice.id}`);
    console.log(`   Subtotal: ${invoice.subtotal / 100} ${invoice.currency}`);
    console.log(`   Total: ${invoice.total / 100} ${invoice.currency}\n`);

    // 4. Check line items
    const lineItems = await stripe.invoices.listLineItems(invoice.id);
    console.log(`📦 Line items: ${lineItems.data.length}`);
    lineItems.data.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.description}`);
      console.log(`      Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
    });

    if (lineItems.data.length > 0) {
      console.log('\n✅ SUCCESS! Invoice includes line items!');
    } else {
      console.log('\n⚠️  FAIL: Invoice has no line items');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testFreshInvoice().catch(console.error);
