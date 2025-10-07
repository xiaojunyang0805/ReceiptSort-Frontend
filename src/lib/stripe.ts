/**
 * Stripe Integration Library
 *
 * Handles Stripe payment processing for credit purchases
 */

import Stripe from 'stripe'

// Initialize Stripe with secret key
// Use placeholder key during build if not set
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

/**
 * Credit Package Definition
 */
export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  priceId: string
  description: string
  popular?: boolean
}

/**
 * Subscription Plan Definition
 */
export interface SubscriptionPlan {
  id: string
  name: string
  creditsPerMonth: number
  pricePerMonth: number
  priceId: string
  description: string
  popular?: boolean
}

/**
 * Credit Packages
 * Update priceId values with your actual Stripe Price IDs from dashboard
 */
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    description: 'Perfect for trying out the service',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 25,
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_BASIC || 'price_basic',
    description: 'Great for regular users',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 100,
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    description: 'Best value for power users',
  },
  {
    id: 'business',
    name: 'Business',
    credits: 500,
    price: 99.99,
    priceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
    description: 'For high-volume businesses',
  },
]

/**
 * Subscription Plans
 * Update priceId values with your actual Stripe Price IDs from dashboard
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    creditsPerMonth: 50,
    pricePerMonth: 19,
    priceId: process.env.STRIPE_PRICE_SUB_BASIC || 'price_sub_basic',
    description: 'Perfect for regular users',
  },
  {
    id: 'pro',
    name: 'Pro',
    creditsPerMonth: 200,
    pricePerMonth: 39,
    priceId: process.env.STRIPE_PRICE_SUB_PRO || 'price_sub_pro',
    description: 'Best for power users',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    creditsPerMonth: 1000,
    pricePerMonth: 99,
    priceId: process.env.STRIPE_PRICE_SUB_BUSINESS || 'price_sub_business',
    description: 'For high-volume businesses',
  },
]

/**
 * Get package by ID
 */
export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

/**
 * Get subscription plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId)
}

/**
 * Create Stripe Checkout Session
 *
 * @param priceId - Stripe Price ID
 * @param userId - User ID for metadata
 * @param userEmail - User email for pre-filling
 * @param packageId - Package ID for metadata
 * @param credits - Number of credits for metadata
 * @returns Stripe Checkout Session
 */
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  userEmail: string,
  packageId: string,
  credits: number
): Promise<Stripe.Checkout.Session> {
  // Hardcode the URL for now to bypass environment variable issues
  const baseUrl = 'https://receiptsort.vercel.app'

  console.log('[Stripe] Using hardcoded baseUrl:', baseUrl)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/credits?canceled=true`,
    customer_email: userEmail,
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: credits.toString(),
    },
    payment_intent_data: {
      metadata: {
        user_id: userId,
        package_id: packageId,
        credits: credits.toString(),
      },
    },
  })

  return session
}

/**
 * Create Stripe Subscription Checkout Session
 *
 * @param priceId - Stripe Price ID for subscription
 * @param userId - User ID for metadata
 * @param userEmail - User email for pre-filling
 * @param planId - Plan ID for metadata
 * @param creditsPerMonth - Number of credits per month
 * @returns Stripe Checkout Session
 */
export async function createSubscriptionCheckoutSession(
  priceId: string,
  userId: string,
  userEmail: string,
  planId: string,
  creditsPerMonth: number
): Promise<Stripe.Checkout.Session> {
  const baseUrl = 'https://receiptsort.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/credits?canceled=true`,
    customer_email: userEmail,
    metadata: {
      user_id: userId,
      plan_id: planId,
      credits_per_month: creditsPerMonth.toString(),
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_id: planId,
        credits_per_month: creditsPerMonth.toString(),
      },
    },
  })

  return session
}

/**
 * Create Stripe Customer Portal Session
 *
 * @param customerId - Stripe Customer ID
 * @returns Stripe Portal Session
 */
export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const baseUrl = 'https://receiptsort.vercel.app'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/credits`,
  })

  return session
}

/**
 * Construct Stripe Webhook Event
 *
 * @param body - Raw request body
 * @param signature - Stripe signature from headers
 * @returns Verified Stripe Event
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    return event
  } catch (err) {
    const error = err as Error
    throw new Error(`Webhook signature verification failed: ${error.message}`)
  }
}

/**
 * Retrieve Checkout Session
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns Stripe Checkout Session with line items
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  })
  return session
}

/**
 * Get Stripe client (for advanced use cases)
 */
export function getStripeClient(): Stripe {
  return stripe
}

export default stripe
