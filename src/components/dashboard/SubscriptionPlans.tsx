'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Loader2, Repeat } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function SubscriptionPlans() {
  const t = useTranslations('dashboard.credits.subscriptions')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    try {
      setLoadingPlan(planId)

      // Call subscribe API
      const response = await fetch('/api/credits/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription')
      setLoadingPlan(null)
    }
  }

  const calculatePricePerReceipt = (pricePerMonth: number, creditsPerMonth: number) => {
    return (pricePerMonth / creditsPerMonth).toFixed(2)
  }

  const calculateSavings = (pricePerMonth: number, creditsPerMonth: number) => {
    // Compare to one-time pricing (average ~$0.40/credit)
    const oneTimeEquivalent = creditsPerMonth * 0.40
    const savings = ((oneTimeEquivalent - pricePerMonth) / oneTimeEquivalent) * 100
    return Math.round(savings)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Repeat className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        {t('subtitle')}
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const pricePerReceipt = calculatePricePerReceipt(plan.pricePerMonth, plan.creditsPerMonth)
          const savings = calculateSavings(plan.pricePerMonth, plan.creditsPerMonth)
          const isLoading = loadingPlan === plan.id

          return (
            <Card
              key={plan.id}
              className={plan.popular ? 'border-primary shadow-lg relative' : 'relative'}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t('bestValue')}
                </div>
              )}

              {savings > 0 && (
                <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {t('save', { percent: savings })}
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits per month */}
                <div>
                  <div className="text-4xl font-bold">{plan.creditsPerMonth}</div>
                  <p className="text-sm text-muted-foreground">{t('creditsPerMonth')}</p>
                </div>

                {/* Price */}
                <div>
                  <div className="text-3xl font-bold">${plan.pricePerMonth}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('perMonth')} · ${pricePerReceipt}/receipt
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('receiptsPerMonth', { count: plan.creditsPerMonth })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('aiPoweredExtraction')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('automaticRenewal')}
                  </li>
                  {plan.creditsPerMonth >= 200 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {t('prioritySupport')}
                    </li>
                  )}
                  {plan.creditsPerMonth >= 1000 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {t('bulkProcessing')}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('cancelAnytime')}
                  </li>
                </ul>

                {/* Subscribe Button */}
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('processing')}
                    </>
                  ) : (
                    t('subscribe')
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t('disclaimer')}
      </p>
    </div>
  )
}
