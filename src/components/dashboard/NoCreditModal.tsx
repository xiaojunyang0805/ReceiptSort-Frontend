'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, Sparkles, Loader2 } from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import { toast } from 'sonner'

interface NoCreditModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NoCreditModal({ isOpen, onClose }: NoCreditModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            No Credits Remaining
          </DialogTitle>
          <DialogDescription>
            You need credits to process receipts. Purchase a credit package to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 py-4">
          {CREDIT_PACKAGES.map((pkg) => {
            const pricePerCredit = calculatePricePerCredit(pkg.price, pkg.credits)
            const isLoading = loadingPackage === pkg.id

            return (
              <Card
                key={pkg.id}
                className={pkg.popular ? 'border-primary shadow-md relative' : 'relative'}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Best Value
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Credits and Price */}
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{pkg.credits}</div>
                    <div className="text-sm text-muted-foreground">credits</div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold">${pkg.price}</div>
                    <p className="text-xs text-muted-foreground">
                      ${pricePerCredit}/credit
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      Process {pkg.credits} receipts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      AI-powered extraction
                    </li>
                    {pkg.credits >= 100 && (
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                        Priority support
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                      Never expires
                    </li>
                  </ul>

                  {/* Purchase Button */}
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading}
                    variant={pkg.popular ? 'default' : 'outline'}
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Purchase Credits'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
