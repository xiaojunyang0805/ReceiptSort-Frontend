import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSubscriptionCheckoutSession, getPlanById } from '@/lib/stripe'

interface SubscribeRequest {
  plan_id: string
}

/**
 * POST /api/credits/subscribe
 * Create Stripe Subscription Checkout Session
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
    const body: SubscribeRequest = await request.json()
    const { plan_id } = body

    if (!plan_id) {
      return NextResponse.json(
        { error: 'plan_id is required' },
        { status: 400 }
      )
    }

    console.log(`[Subscribe] User ${user.id} requesting plan: ${plan_id}`)

    // 3. Find plan by ID
    const plan = getPlanById(plan_id)

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan_id: ${plan_id}` },
        { status: 400 }
      )
    }

    console.log(`[Subscribe] Plan found: ${plan.name} - ${plan.creditsPerMonth} credits/month for $${plan.pricePerMonth}/month`)

    // 4. Get user email
    const userEmail = user.email || ''

    // 5. Create Stripe Subscription Checkout Session
    const session = await createSubscriptionCheckoutSession(
      plan.priceId,
      user.id,
      userEmail,
      plan.id,
      plan.creditsPerMonth
    )

    console.log(`[Subscribe] Stripe session created: ${session.id}`)

    // 6. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('[Subscribe] Error creating subscription:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
