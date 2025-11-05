'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useRouter } from '@/lib/navigation'

interface LowCreditBannerProps {
  credits: number
}

const LOW_CREDIT_THRESHOLD = 5
const DISMISS_KEY = 'low-credit-banner-dismissed'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function LowCreditBanner({ credits }: LowCreditBannerProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // Check if banner was recently dismissed
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil, 10)
      if (Date.now() < dismissedTime) {
        setIsDismissed(true)
        return
      }
    }

    // Show banner if credits are low
    if (credits < LOW_CREDIT_THRESHOLD) {
      setIsDismissed(false)
    }
  }, [credits])

  const handleDismiss = () => {
    // Store dismiss timestamp
    const dismissUntil = Date.now() + DISMISS_DURATION
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString())
    setIsDismissed(true)
  }

  const handleBuyCredits = () => {
    router.push('/credits')
  }

  if (isDismissed || credits >= LOW_CREDIT_THRESHOLD) {
    return null
  }

  return (
    <Alert className="border-yellow-600 bg-yellow-50 text-yellow-900 relative">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          <strong>Running low on credits!</strong> You have {credits} credit{credits !== 1 ? 's' : ''} remaining.
          Purchase more to continue processing receipts.
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleBuyCredits}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Buy Credits
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-yellow-900 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
