import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'
// import { createSubscriptionCheckoutSession, getPlanById } from '@/lib/stripe'

// interface SubscribeRequest {
//   plan_id: string
// }

/**
 * POST /api/credits/subscribe
 *
 * DEPRECATED: Subscription feature removed as of 2025-10-19
 *
 * Reason: Subscriptions add significant complexity (10x more than one-time payments):
 * - Recurring invoices and failed payment handling
 * - Complex credit management across renewals
 * - Different invoice workflow (may conflict with current invoice_creation)
 * - Extensive testing requirements (monthly cycles)
 * - Increased customer support burden
 *
 * Decision: Focus on simple, working one-time payments for launch.
 * Subscriptions can be added later when there's proven demand and dedicated time.
 *
 * See: docs/SUBSCRIPTION_ANALYSIS.md for full analysis
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: NextRequest) {
  // Return 501 Not Implemented
  return NextResponse.json(
    {
      error: 'Subscription feature is not currently available',
      message: 'Please use one-time credit purchases instead'
    },
    { status: 501 }
  )

  // Original implementation commented out - kept for future reference
  //
  // try {
  //   const supabase = await createClient()
  //   const { data: { user }, error: authError } = await supabase.auth.getUser()
  //   if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  //
  //   const body: SubscribeRequest = await request.json()
  //   const { plan_id } = body
  //   if (!plan_id) return NextResponse.json({ error: 'plan_id is required' }, { status: 400 })
  //
  //   const plan = getPlanById(plan_id)
  //   if (!plan) return NextResponse.json({ error: `Invalid plan_id: ${plan_id}` }, { status: 400 })
  //
  //   const session = await createSubscriptionCheckoutSession(
  //     plan.priceId, user.id, user.email || '', plan.id, plan.creditsPerMonth
  //   )
  //
  //   return NextResponse.json({ url: session.url, sessionId: session.id })
  // } catch (error) {
  //   return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  // }
}
