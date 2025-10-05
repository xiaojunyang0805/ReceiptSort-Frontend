import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constructWebhookEvent } from '@/lib/stripe'
import Stripe from 'stripe'

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // 2. Verify webhook signature and construct event
    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      const error = err as Error
      console.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: `Webhook Error: ${error.message}` },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Event received: ${event.type} (${event.id})`)

    // 3. Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log(`[Webhook] Checkout completed: ${session.id}`)
        console.log(`[Webhook] Payment status: ${session.payment_status}`)
        console.log(`[Webhook] Metadata:`, session.metadata)

        // Only process if payment is successful
        if (session.payment_status === 'paid') {
          await handleCheckoutCompleted(session)
        } else {
          console.warn(`[Webhook] Payment not completed yet: ${session.payment_status}`)
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`)
        // Additional handling if needed
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error(`[Webhook] Payment failed: ${paymentIntent.id}`)
        // Handle failed payment if needed
        break
      }

      case 'invoice.payment_succeeded': {
        // For future subscription support
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Invoice payment succeeded: ${invoice.id}`)
        // Handle subscription renewal when implemented
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    // 4. Return success response
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const { user_id, package_id, credits } = session.metadata || {}

    if (!user_id || !credits) {
      throw new Error('Missing required metadata: user_id or credits')
    }

    const creditsToAdd = parseInt(credits, 10)

    console.log(`[Webhook] Adding ${creditsToAdd} credits to user ${user_id}`)

    // 1. Get current user credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user_id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch user profile: ${fetchError.message}`)
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + creditsToAdd

    // 2. Update user credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user_id)

    if (updateError) {
      throw new Error(`Failed to update credits: ${updateError.message}`)
    }

    console.log(`[Webhook] Credits updated: ${currentCredits} -> ${newCredits}`)

    // 3. Create credit transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Purchased ${package_id} package`,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
      })

    if (transactionError) {
      console.error('[Webhook] Failed to create transaction record:', transactionError)
      // Don't throw - credits already added, this is just for record-keeping
    } else {
      console.log(`[Webhook] Transaction record created`)
    }

    // 4. TODO: Send confirmation email (optional)
    // await sendCreditPurchaseEmail(user_id, creditsToAdd, package_id)

    console.log(`[Webhook] Checkout completed successfully for user ${user_id}`)
  } catch (error) {
    console.error('[Webhook] Error handling checkout completion:', error)
    throw error // Re-throw to mark webhook as failed
  }
}

// Disable body parsing for webhook verification
export const runtime = 'edge'
