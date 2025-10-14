'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function CreditPackages() {
  const t = useTranslations('creditPackages')
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null)

  const handlePurchase = async (packageId: string) => {
    try {
      setLoadingPackage(packageId)

      // Call checkout API
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      setLoadingPackage(null)
    }
  }

  const calculatePricePerCredit = (price: number, credits: number) => {
    return (price / credits).toFixed(2)
  }

  const calculateDiscount = (price: number, credits: number) => {
    const basePrice = 0.50 // Starter pack price per credit ($4.99 / 10)
    const currentPrice = price / credits
    const discountPercent = ((basePrice - currentPrice) / basePrice) * 100
    return Math.round(discountPercent)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('title')}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKAGES.map((pkg) => {
          const pricePerCredit = calculatePricePerCredit(pkg.price, pkg.credits)
          const discount = calculateDiscount(pkg.price, pkg.credits)
          const isLoading = loadingPackage === pkg.id

          return (
            <Card
              key={pkg.id}
              className={pkg.popular ? 'border-primary shadow-lg relative' : 'relative'}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t('bestValue')}
                </div>
              )}

              {discount > 0 && !pkg.popular && (
                <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {t('save', { percent: discount })}
                </div>
              )}

              <CardHeader>
                <CardTitle>{t(`${pkg.id}.name`)}</CardTitle>
                <CardDescription>{t(`${pkg.id}.description`)}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Credits */}
                <div>
                  <div className="text-4xl font-bold">{pkg.credits}</div>
                  <p className="text-sm text-muted-foreground">{t('credits')}</p>
                </div>

                {/* Price */}
                <div>
                  <div className="text-3xl font-bold">${pkg.price}</div>
                  <p className="text-sm text-muted-foreground">
                    ${pricePerCredit}{t('perCredit')}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('processReceipts', { count: pkg.credits })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('aiPoweredExtraction')}
                  </li>
                  {pkg.credits >= 100 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {t('prioritySupport')}
                    </li>
                  )}
                  {pkg.credits >= 500 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {t('bulkProcessing')}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {t('neverExpires')}
                  </li>
                </ul>

                {/* Purchase Button */}
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  variant={pkg.popular ? 'default' : 'outline'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('processing')}
                    </>
                  ) : (
                    t('purchase')
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
