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
  // Use environment variable or fallback to production URL
  const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://receiptsort.vercel.app'

  console.log('[Stripe] Using baseUrl:', baseUrl)

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
  const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://receiptsort.vercel.app'

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
  const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://receiptsort.vercel.app'

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
 * Create or retrieve a Stripe Customer
 *
 * @param userId - User ID for metadata
 * @param userEmail - User email
 * @param userName - User full name (optional)
 * @returns Stripe Customer
 */
export async function createOrGetCustomer(
  userId: string,
  userEmail: string,
  userName?: string
): Promise<Stripe.Customer> {
  // First, try to find existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    console.log(`[Stripe] Found existing customer: ${existingCustomers.data[0].id}`)
    return existingCustomers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: userEmail,
    name: userName,
    metadata: {
      user_id: userId,
    },
  })

  console.log(`[Stripe] Created new customer: ${customer.id}`)
  return customer
}

/**
 * Create Invoice-Based Payment for Credit Purchase
 * This creates a proper invoice that will be automatically emailed to the customer
 *
 * @param priceId - Stripe Price ID
 * @param userId - User ID for metadata
 * @param userEmail - User email
 * @param userName - User full name (optional)
 * @param packageId - Package ID for metadata
 * @param credits - Number of credits
 * @returns Object containing invoice and payment intent
 */
export async function createInvoicePayment(
  priceId: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  packageId: string,
  credits: number
): Promise<{ invoice: Stripe.Invoice; paymentIntent: string }> {
  // 1. Create or get customer
  const customer = await createOrGetCustomer(userId, userEmail, userName)

  // 2. Get price details
  const priceObj = await stripe.prices.retrieve(priceId)
  const amount = priceObj.unit_amount || 0
  const currency = priceObj.currency

  // 3. Create invoice item
  await stripe.invoiceItems.create({
    customer: customer.id,
    amount,
    currency,
    description: `ReceiptSort Credits - ${packageId} Package (${credits} credits)`,
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: credits.toString(),
      stripe_price_id: priceId,
    },
  })

  // 3. Create invoice
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    auto_advance: true, // Auto-finalize the invoice
    collection_method: 'charge_automatically', // Charge immediately
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: credits.toString(),
      product_type: 'credit_package',
    },
    description: `ReceiptSort Credits Purchase - ${credits} credits`,
  })

  console.log(`[Stripe] Created invoice: ${invoice.id}`)

  // 4. Finalize and pay the invoice
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
    auto_advance: true,
  })

  // 5. Pay the invoice
  const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id)

  console.log(`[Stripe] Invoice payment initiated: ${paidInvoice.id}`)

  return {
    invoice: paidInvoice,
    paymentIntent: (paidInvoice as unknown as { payment_intent?: string }).payment_intent || '',
  }
}

/**
 * Create Hosted Invoice Page for Credit Purchase
 * This creates an invoice and returns a hosted URL for payment
 *
 * @param priceId - Stripe Price ID
 * @param userId - User ID for metadata
 * @param userEmail - User email
 * @param userName - User full name (optional)
 * @param packageId - Package ID for metadata
 * @param credits - Number of credits
 * @returns Invoice with hosted URL
 */
export async function createHostedInvoice(
  priceId: string,
  userId: string,
  userEmail: string,
  userName: string | undefined,
  packageId: string,
  credits: number
): Promise<Stripe.Invoice> {
  // 1. Create or get customer
  const customer = await createOrGetCustomer(userId, userEmail, userName)

  // 2. Get price details
  const priceObj = await stripe.prices.retrieve(priceId)
  const amount = priceObj.unit_amount || 0
  const currency = priceObj.currency

  // 3. Create invoice item
  await stripe.invoiceItems.create({
    customer: customer.id,
    amount,
    currency,
    description: `ReceiptSort Credits - ${packageId} Package (${credits} credits)`,
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: credits.toString(),
      stripe_price_id: priceId,
    },
  })

  // 3. Create invoice with hosted page
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    auto_advance: false, // Manual finalization to get hosted URL
    collection_method: 'charge_automatically',
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: credits.toString(),
      product_type: 'credit_package',
    },
    description: `ReceiptSort Credits Purchase - ${credits} credits`,
  })

  // 4. Finalize invoice to generate hosted URL
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

  console.log(`[Stripe] Created hosted invoice: ${finalizedInvoice.id}`)
  console.log(`[Stripe] Hosted URL: ${finalizedInvoice.hosted_invoice_url}`)

  return finalizedInvoice
}

/**
 * Retrieve Invoice by ID
 *
 * @param invoiceId - Stripe Invoice ID
 * @returns Stripe Invoice
 */
export async function retrieveInvoice(
  invoiceId: string
): Promise<Stripe.Invoice> {
  const invoice = await stripe.invoices.retrieve(invoiceId)
  return invoice
}

/**
 * List invoices for a customer
 *
 * @param customerId - Stripe Customer ID
 * @param limit - Number of invoices to retrieve
 * @returns List of invoices
 */
export async function listCustomerInvoices(
  customerId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  })
  return invoices.data
}

/**
 * Send invoice email manually
 *
 * @param invoiceId - Stripe Invoice ID
 * @returns Stripe Invoice
 */
export async function sendInvoiceEmail(
  invoiceId: string
): Promise<Stripe.Invoice> {
  const invoice = await stripe.invoices.sendInvoice(invoiceId)
  console.log(`[Stripe] Invoice email sent: ${invoiceId}`)
  return invoice
}

/**
 * Get Stripe client (for advanced use cases)
 */
export function getStripeClient(): Stripe {
  return stripe
}

export default stripe
