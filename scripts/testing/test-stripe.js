const Stripe = require('stripe');

const stripe = new Stripe('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', {
  apiVersion: '2025-09-30.clover',
});

async function testCheckout() {
  try {
    const baseUrl = 'https://receiptsort.vercel.app';

    console.log('Creating checkout session...');
    console.log('Base URL:', baseUrl);
    console.log('Price ID: price_1SFJ302Q25JDcEYXHccw9qBK');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: 'price_1SFJ302Q25JDcEYXHccw9qBK',
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits?canceled=true`,
      customer_email: 'test@example.com',
      metadata: {
        user_id: 'test-user',
        package_id: 'starter',
        credits: '10',
      },
    });

    console.log('\n=== Session Created ===');
    console.log('Session ID:', session.id);
    console.log('Session URL:', session.url);
    console.log('Session status:', session.status);
    console.log('Payment status:', session.payment_status);
    console.log('\nFull session:', JSON.stringify(session, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testCheckout();
