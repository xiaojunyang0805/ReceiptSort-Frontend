import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, getPackageById } from '@/lib/stripe'

interface CheckoutRequest {
  package_id: string
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
    const { package_id } = body

    if (!package_id) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      )
    }

    console.log(`[Checkout] User ${user.id} requesting package: ${package_id}`)

    // 3. Find package by ID
    const creditPackage = getPackageById(package_id)

    if (!creditPackage) {
      return NextResponse.json(
        { error: `Invalid package_id: ${package_id}` },
        { status: 400 }
      )
    }

    console.log(`[Checkout] Package found: ${creditPackage.name} - ${creditPackage.credits} credits for $${creditPackage.price}`)

    // 4. Get user email
    const userEmail = user.email || ''

    // 5. Create Stripe Checkout Session
    const session = await createCheckoutSession(
      creditPackage.priceId,
      user.id,
      userEmail,
      creditPackage.id,
      creditPackage.credits
    )

    console.log(`[Checkout] Stripe session created: ${session.id}`)

    // 6. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('[Checkout] Error creating checkout session:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
