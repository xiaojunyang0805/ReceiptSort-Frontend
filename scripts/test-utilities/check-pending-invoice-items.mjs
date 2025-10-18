import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2025-09-30.clover',
});

async function checkPendingItems() {
  console.log('🔍 Checking pending invoice items...\n');

  const customerEmail = '601404242@qq.com';

  try {
    // Find customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.log('No customer found');
      return;
    }

    const customer = customers.data[0];
    console.log(`Customer: ${customer.id} (${customer.email})\n`);

    // List all invoice items for this customer
    const invoiceItems = await stripe.invoiceItems.list({
      customer: customer.id,
      limit: 100,
    });

    console.log(`Total invoice items: ${invoiceItems.data.length}\n`);

    if (invoiceItems.data.length === 0) {
      console.log('No invoice items found');
      return;
    }

    invoiceItems.data.forEach((item, i) => {
      console.log(`${i + 1}. Invoice Item: ${item.id}`);
      console.log(`   Description: ${item.description}`);
      console.log(`   Amount: ${item.amount / 100} ${item.currency.toUpperCase()}`);
      console.log(`   Invoice: ${item.invoice || 'PENDING (not assigned to any invoice)'}`);
      console.log(`   Created: ${new Date(item.created * 1000).toLocaleString()}`);
      console.log('');
    });

    // Count pending items
    const pendingItems = invoiceItems.data.filter(item => !item.invoice);
    console.log(`\n📊 Summary:`);
    console.log(`   Total items: ${invoiceItems.data.length}`);
    console.log(`   Pending items: ${pendingItems.length}`);
    console.log(`   Assigned to invoices: ${invoiceItems.data.length - pendingItems.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPendingItems().catch(console.error);
