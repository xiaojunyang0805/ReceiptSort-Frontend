import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function testInvoiceCreation() {
  console.log('🧪 Testing invoice creation with line items...\n');

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

    // 2. Create invoice item
    console.log('\n📝 Creating invoice item...');
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      amount: amount,
      currency: currency,
      description: `ReceiptSort Credits - Starter Package (10 credits)`,
      metadata: {
        test: 'true',
        package_id: 'starter',
        credits: '10',
      },
    });
    console.log(`✅ Invoice item created: ${invoiceItem.id}`);
    console.log(`   Amount: ${invoiceItem.amount} ${invoiceItem.currency}`);

    // 3. Wait a moment to ensure invoice item is committed
    console.log('\n⏳ Waiting for invoice item to be committed...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Create invoice
    console.log('\n📋 Creating invoice...');
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: false,
      collection_method: 'charge_automatically',
      metadata: {
        test: 'true',
        package_id: 'starter',
        credits: '10',
      },
      description: `Test Invoice - ReceiptSort Credits`,
      footer: 'Thank you for your purchase!',
    });
    console.log(`✅ Invoice created: ${invoice.id}`);
    console.log(`   Status: ${invoice.status}`);
    console.log(`   Subtotal: ${invoice.subtotal} ${invoice.currency}`);
    console.log(`   Total: ${invoice.total} ${invoice.currency}`);

    // 4. Finalize invoice
    console.log('\n✅ Finalizing invoice...');
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(`✅ Invoice finalized: ${finalizedInvoice.id}`);
    console.log(`   Amount Due: ${finalizedInvoice.amount_due} ${finalizedInvoice.currency}`);
    console.log(`   Subtotal: ${finalizedInvoice.subtotal} ${finalizedInvoice.currency}`);
    console.log(`   Total: ${finalizedInvoice.total} ${finalizedInvoice.currency}`);

    // 5. Check line items
    console.log('\n📦 Checking line items...');
    const lineItems = await stripe.invoices.listLineItems(finalizedInvoice.id);
    console.log(`   Line items count: ${lineItems.data.length}`);

    if (lineItems.data.length === 0) {
      console.log('   ⚠️  NO LINE ITEMS!');
    } else {
      lineItems.data.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.description}`);
        console.log(`      Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
      });
    }

    // 6. Mark as paid out of band
    console.log('\n💰 Marking invoice as paid...');
    const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
      paid_out_of_band: true,
    });
    console.log(`✅ Invoice marked as paid: ${paidInvoice.id}`);
    console.log(`   Amount Paid: ${paidInvoice.amount_paid} ${paidInvoice.currency}`);
    console.log(`   Status: ${paidInvoice.status}`);
    console.log(`   PDF: ${paidInvoice.invoice_pdf}`);

    console.log('\n✅ Test complete! Check the invoice in Stripe dashboard.');
    console.log(`   Invoice URL: https://dashboard.stripe.com/test/invoices/${paidInvoice.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.type) console.error(`   Type: ${error.type}`);
    if (error.code) console.error(`   Code: ${error.code}`);
  }
}

testInvoiceCreation().catch(console.error);
