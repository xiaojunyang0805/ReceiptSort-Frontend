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
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Invoice payment succeeded: ${invoice.id}`)

        // Handle subscription renewal - add monthly credits
        // Check if this is a subscription invoice
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription
        if (subscriptionId) {
          await handleSubscriptionRenewal(invoice)
        } else {
          // Handle one-time invoice payment (credit purchase)
          await handleInvoicePayment(invoice)
        }
        break
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Invoice finalized: ${invoice.id}`)

        // Store invoice record in database
        await storeInvoiceRecord(invoice)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Invoice paid: ${invoice.id}`)

        // Update invoice record status
        await updateInvoiceStatus(invoice.id, 'paid')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Webhook] Subscription canceled: ${subscription.id}`)

        // Update user profile to remove subscription info
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Webhook] Subscription updated: ${subscription.id}`)

        // Update user profile with new subscription info
        await handleSubscriptionUpdated(subscription)
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

/**
 * Handle subscription renewal (invoice.payment_succeeded)
 */
async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  try {
    // const subscription = invoice.subscription as string
    const metadata = (invoice as unknown as { subscription_metadata?: Record<string, string> }).subscription_metadata || {}
    const { user_id, credits_per_month } = metadata

    if (!user_id || !credits_per_month) {
      console.warn('[Webhook] Missing subscription metadata')
      return
    }

    const creditsToAdd = parseInt(credits_per_month, 10)

    console.log(`[Webhook] Adding ${creditsToAdd} monthly credits to user ${user_id}`)

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
    const paymentIntent = (invoice as unknown as { payment_intent?: string }).payment_intent
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Monthly subscription credits`,
        stripe_payment_intent: paymentIntent || null,
      })

    if (transactionError) {
      console.error('[Webhook] Failed to create transaction record:', transactionError)
    } else {
      console.log(`[Webhook] Transaction record created for subscription renewal`)
    }

    console.log(`[Webhook] Subscription renewal processed for user ${user_id}`)
  } catch (error) {
    console.error('[Webhook] Error handling subscription renewal:', error)
    throw error
  }
}

/**
 * Handle subscription cancellation (customer.subscription.deleted)
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const { user_id } = subscription.metadata || {}

    if (!user_id) {
      console.warn('[Webhook] Missing user_id in subscription metadata')
      return
    }

    console.log(`[Webhook] Canceling subscription for user ${user_id}`)

    // Update user profile to remove subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: null,
      })
      .eq('id', user_id)

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    console.log(`[Webhook] Subscription canceled for user ${user_id}`)
  } catch (error) {
    console.error('[Webhook] Error handling subscription cancellation:', error)
    throw error
  }
}

/**
 * Handle subscription update (customer.subscription.updated)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { user_id } = subscription.metadata || {}

    if (!user_id) {
      console.warn('[Webhook] Missing user_id in subscription metadata')
      return
    }

    console.log(`[Webhook] Updating subscription for user ${user_id}`)

    // Update user profile with subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('id', user_id)

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    console.log(`[Webhook] Subscription updated for user ${user_id}: ${subscription.status}`)
  } catch (error) {
    console.error('[Webhook] Error handling subscription update:', error)
    throw error
  }
}

/**
 * Handle invoice payment for one-time credit purchases
 */
async function handleInvoicePayment(invoice: Stripe.Invoice) {
  try {
    const { user_id, package_id, credits } = invoice.metadata || {}

    if (!user_id || !credits) {
      console.warn('[Webhook] Missing required invoice metadata: user_id or credits')
      return
    }

    const creditsToAdd = parseInt(credits, 10)

    console.log(`[Webhook] Processing invoice payment: ${creditsToAdd} credits for user ${user_id}`)

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
    const paymentIntent = (invoice as unknown as { payment_intent?: string }).payment_intent
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id,
        amount: creditsToAdd,
        type: 'purchase',
        description: `Purchased ${package_id} package (Invoice: ${invoice.number})`,
        stripe_payment_intent: paymentIntent || null,
      })

    if (transactionError) {
      console.error('[Webhook] Failed to create transaction record:', transactionError)
    } else {
      console.log(`[Webhook] Transaction record created for invoice ${invoice.id}`)
    }

    console.log(`[Webhook] Invoice payment processed successfully for user ${user_id}`)
  } catch (error) {
    console.error('[Webhook] Error handling invoice payment:', error)
    throw error
  }
}

/**
 * Store invoice record in database
 */
async function storeInvoiceRecord(invoice: Stripe.Invoice) {
  try {
    const { user_id } = invoice.metadata || {}

    if (!user_id) {
      console.warn('[Webhook] Missing user_id in invoice metadata')
      return
    }

    // Store invoice record
    const { error } = await supabase
      .from('invoices')
      .upsert({
        id: invoice.id,
        user_id,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        invoice_number: invoice.number,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        created_at: new Date(invoice.created * 1000).toISOString(),
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paid_at: invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          : null,
        metadata: invoice.metadata,
      }, {
        onConflict: 'stripe_invoice_id'
      })

    if (error) {
      console.error('[Webhook] Failed to store invoice record:', error)
    } else {
      console.log(`[Webhook] Invoice record stored: ${invoice.id}`)
    }
  } catch (error) {
    console.error('[Webhook] Error storing invoice record:', error)
    // Don't throw - this is just for record-keeping
  }
}

/**
 * Update invoice status in database
 */
async function updateInvoiceStatus(invoiceId: string, status: string) {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('stripe_invoice_id', invoiceId)

    if (error) {
      console.error('[Webhook] Failed to update invoice status:', error)
    } else {
      console.log(`[Webhook] Invoice status updated: ${invoiceId} -> ${status}`)
    }
  } catch (error) {
    console.error('[Webhook] Error updating invoice status:', error)
    // Don't throw - this is just for record-keeping
  }
}

// Disable body parsing for webhook verification
export const runtime = 'edge'
