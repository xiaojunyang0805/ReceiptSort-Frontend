import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constructWebhookEvent, createOrGetCustomer, getStripeClient } from '@/lib/stripe'
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
      event = await constructWebhookEvent(body, signature)
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

    // 4. Create invoice for VAT record-keeping (payment already completed via checkout)
    try {
      await createInvoiceRecord(session)
      console.log(`[Webhook] Invoice record created for VAT purposes`)
    } catch (invoiceError) {
      console.error('[Webhook] Failed to create invoice record:', invoiceError)
      // Don't throw - credits already added, invoice is just for record-keeping
    }

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
        metadata: invoice.metadata as Record<string, unknown>,
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

/**
 * Create invoice record after successful checkout
 * This creates a paid invoice for VAT record-keeping purposes
 * The payment was already collected via the checkout session
 */
async function createInvoiceRecord(session: Stripe.Checkout.Session) {
  try {
    const stripe = getStripeClient()
    const { user_id, package_id, credits } = session.metadata || {}

    if (!user_id || !package_id || !credits) {
      console.warn('[Webhook] Missing metadata for invoice creation')
      return
    }

    const customerEmail = session.customer_email || session.customer_details?.email
    if (!customerEmail) {
      console.warn('[Webhook] No customer email available for invoice')
      return
    }

    // Get customer name if available
    const customerName = session.customer_details?.name

    // 1. Create or get Stripe customer
    const customer = await createOrGetCustomer(user_id, customerEmail, customerName || undefined)

    // 2. Get payment details
    const amountPaid = session.amount_total || 0
    const currency = session.currency || 'usd'
    const paymentIntentId = session.payment_intent as string

    console.log(`[Webhook] Creating invoice for ${amountPaid} ${currency}, payment_intent: ${paymentIntentId}`)

    // 3. Create draft invoice with charge_automatically to prevent payment button
    // Stripe will automatically send email on finalize if email settings are enabled
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      currency, // Must match the currency of invoice items
      auto_advance: false, // Manual control
      collection_method: 'charge_automatically', // Prevents showing payment page
      metadata: {
        user_id,
        package_id,
        credits,
        checkout_session_id: session.id,
        product_type: 'credit_package',
        payment_status: 'paid',
      },
      description: `ReceiptSort Credits Purchase - ${credits} credits`,
      // Don't set footer here - use default footer from Stripe settings which includes VAT
    })

    console.log(`[Webhook] Draft invoice created: ${invoice.id}`)

    // 4. Create invoice item LINKED to the invoice (this is critical!)
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id, // Explicitly link to invoice
      amount: amountPaid,
      currency,
      description: `ReceiptSort Credits - ${package_id} Package (${credits} credits)`,
      metadata: {
        user_id,
        package_id,
        credits,
        checkout_session_id: session.id,
      },
    })

    console.log(`[Webhook] Invoice item created and linked: ${invoiceItem.id}`)

    // 5. Finalize the invoice to make it viewable and get the final amount
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    console.log(`[Webhook] Invoice finalized: ${finalizedInvoice.id}`)
    console.log(`[Webhook] Invoice amount_due: ${finalizedInvoice.amount_due}`)

    // 6. Mark invoice as paid and link the checkout payment
    // We use paid_out_of_band because payment was already collected via checkout
    // NOTE: Cannot use both paid_out_of_band and forgive - Stripe only allows one parameter
    const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
      paid_out_of_band: true, // Mark as paid without attempting to charge
    })

    console.log(`[Webhook] Invoice marked as paid: ${paidInvoice.id}`)
    console.log(`[Webhook] Invoice PDF: ${paidInvoice.invoice_pdf}`)
    console.log(`[Webhook] Invoice status: ${paidInvoice.status}`)

    // 7. Store invoice in database
    await storeInvoiceRecord(paidInvoice)

    console.log(`[Webhook] Invoice record created successfully`)
    console.log(`[Webhook] - Invoice ID: ${paidInvoice.id}`)
    console.log(`[Webhook] - Invoice Number: ${paidInvoice.number}`)
    console.log(`[Webhook] - Status: ${paidInvoice.status}`)
    console.log(`[Webhook] - PDF URL: ${paidInvoice.invoice_pdf}`)
    console.log(`[Webhook] - Amount: ${paidInvoice.amount_paid / 100} ${paidInvoice.currency.toUpperCase()}`)
    console.log(`[Webhook] - Customer: ${customerEmail}`)
    console.log(`[Webhook] Note: Invoice email will be sent if "Successful payments" is enabled in Stripe Dashboard`)

  } catch (error) {
    console.error('[Webhook] Error creating invoice after checkout:', error)
    throw error
  }
}

// Use Node.js runtime for Supabase compatibility
export const runtime = 'nodejs'

// Disable body parsing for webhook verification
export const dynamic = 'force-dynamic'
