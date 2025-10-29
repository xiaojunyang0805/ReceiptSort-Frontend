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
import { getTranslations } from 'next-intl/server'

export default async function PricingPage() {
  const t = await getTranslations('pricing')
  const tPkg = await getTranslations('creditPackages')
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
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('subheadline')}
        </p>

        {/* Current Balance for Logged-in Users */}
        {user && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-sm font-medium">{t('currentBalance')}:</span>
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
              {profile?.credits ?? 0} {t('credits')}
            </span>
          </div>
        )}
      </div>

      {/* Credit Packages */}
      <div className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('creditPackagesTitle')}</h2>
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
                    {t('popular')}
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{tPkg(`${pkg.id}.name`)}</CardTitle>
                <CardDescription>{tPkg(`${pkg.id}.description`)}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">{t('credits')}</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    ${(pkg.price / pkg.credits).toFixed(2)} {t('perCredit')}
                  </div>
                </div>

                <Button asChild className="w-full" variant={pkg.popular ? 'default' : 'outline'}>
                  {user ? (
                    <Link href="/credits">{t('purchaseCredits')}</Link>
                  ) : (
                    <Link href="/login">{t('getStarted')}</Link>
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
          {t('faq.title')}
        </h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              {t('faq.howCreditsWork.question')}
            </AccordionTrigger>
            <AccordionContent>
              {t('faq.howCreditsWork.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              {t('faq.doCreditsExpire.question')}
            </AccordionTrigger>
            <AccordionContent>
              {t('faq.doCreditsExpire.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              {t('faq.canIGetRefund.question')}
            </AccordionTrigger>
            <AccordionContent>
              {t('faq.canIGetRefund.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              {t('faq.wrongExtraction.question')}
            </AccordionTrigger>
            <AccordionContent>
              {t('faq.wrongExtraction.answer')}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">
              {t('faq.needSubscription.question')}
            </AccordionTrigger>
            <AccordionContent>
              {t('faq.needSubscription.answer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl">{t('readyTitle')}</CardTitle>
            <CardDescription className="text-lg">
              {t('readySubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button asChild size="lg" variant="default">
                  <Link href="/dashboard">{t('goToDashboard')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/credits">{t('purchaseCredits')}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" variant="default">
                  <Link href="/signup">{t('startFree')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">{t('signIn')}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
