import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/lib/navigation'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile if logged in
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Pay as you go or subscribe and save
        </p>

        {/* Current Balance for Logged-in Users */}
        {user && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-sm font-medium">Your current balance:</span>
            <span
              className={`text-lg font-bold ${
                (profile?.credits ?? 0) === 0
                  ? 'text-red-600'
                  : (profile?.credits ?? 0) < 3
                  ? 'text-red-600'
                  : (profile?.credits ?? 0) <= 10
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {profile?.credits ?? 0} credits
            </span>
          </div>
        )}
      </div>

      {/* Credit Packages */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Credit Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">credits</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    ${(pkg.price / pkg.credits).toFixed(2)} per credit
                  </div>
                </div>

                <Button asChild className="w-full" variant={pkg.popular ? 'default' : 'outline'}>
                  {user ? (
                    <Link href="/credits">Purchase Credits</Link>
                  ) : (
                    <Link href="/login">Get Started</Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              How do credits work?
            </AccordionTrigger>
            <AccordionContent>
              Each receipt you upload and process costs 1 credit. Credits are deducted only when the AI successfully extracts data from your receipt. You can purchase credits in packages or subscribe for monthly credits at a discounted rate.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              Do credits expire?
            </AccordionTrigger>
            <AccordionContent>
              No, credits never expire. Once you purchase credits, they remain in your account until you use them. This gives you complete flexibility to use them at your own pace.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              Can I get a refund?
            </AccordionTrigger>
            <AccordionContent>
              Yes! We offer a 30-day money-back guarantee. If you&apos;re not satisfied with our service, contact us within 30 days of your purchase for a full refund on unused credits.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              What if the extraction is wrong?
            </AccordionTrigger>
            <AccordionContent>
              If the AI extraction contains errors or doesn&apos;t meet your expectations, contact our support team. We&apos;ll review the case and provide a free retry or credit refund if the extraction quality was below our standards.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">
              Do I need a subscription?
            </AccordionTrigger>
            <AccordionContent>
              No, subscriptions are completely optional. You can purchase credits as needed with our pay-as-you-go packages. Subscriptions are available if you want to save money with discounted monthly credits, but you&apos;re free to use the service however works best for you.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl">Ready to get started?</CardTitle>
            <CardDescription className="text-lg">
              Start with 10 free credits, no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button asChild size="lg" variant="default">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/credits">Purchase Credits</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" variant="default">
                  <Link href="/signup">Start Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
