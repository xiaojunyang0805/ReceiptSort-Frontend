import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createHostedInvoice, getPackageById } from '@/lib/stripe'

interface CheckoutRequest {
  package_id: string
  use_invoice?: boolean // Optional flag to use invoice-based payment
}

/**
 * POST /api/credits/checkout
 * Create Stripe Checkout Session for credit purchase
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body: CheckoutRequest = await request.json()
    const { package_id, use_invoice = false } = body // Default to checkout mode (invoice mode has issues)

    if (!package_id) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      )
    }

    console.log(`[Checkout] User ${user.id} requesting package: ${package_id}`)
    console.log(`[Checkout] Payment mode: ${use_invoice ? 'invoice' : 'checkout'}`)

    // 3. Find package by ID
    const creditPackage = getPackageById(package_id)

    if (!creditPackage) {
      return NextResponse.json(
        { error: `Invalid package_id: ${package_id}` },
        { status: 400 }
      )
    }

    console.log(`[Checkout] Package found: ${creditPackage.name} - ${creditPackage.credits} credits for $${creditPackage.price}`)

    // 4. Get user email and profile
    const userEmail = user.email || ''

    // Get user's full name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name

    // 5. Create payment (Invoice or Checkout Session)
    if (use_invoice) {
      // Invoice-based payment flow (generates proper invoices)
      console.log(`[Checkout] Creating hosted invoice with priceId: ${creditPackage.priceId}`)

      const invoice = await createHostedInvoice(
        creditPackage.priceId,
        user.id,
        userEmail,
        userName,
        creditPackage.id,
        creditPackage.credits
      )

      console.log(`[Checkout] Invoice created: ${invoice.id}`)
      console.log(`[Checkout] Hosted invoice URL: ${invoice.hosted_invoice_url}`)

      // Return invoice URL
      return NextResponse.json({
        url: invoice.hosted_invoice_url,
        invoiceId: invoice.id,
        paymentMode: 'invoice',
      })
    } else {
      // Original checkout session flow
      console.log(`[Checkout] Creating checkout session with priceId: ${creditPackage.priceId}`)

      const session = await createCheckoutSession(
        creditPackage.priceId,
        user.id,
        userEmail,
        creditPackage.id,
        creditPackage.credits
      )

      console.log(`[Checkout] Checkout session created: ${session.id}`)
      console.log(`[Checkout] Session URL: ${session.url}`)

      if (!session.url) {
        console.error(`[Checkout] ERROR: session.url is null/undefined!`)
      }

      // Return checkout URL
      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
        paymentMode: 'checkout',
      })
    }
  } catch (error) {
    console.error('[Checkout] Error creating checkout session:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
