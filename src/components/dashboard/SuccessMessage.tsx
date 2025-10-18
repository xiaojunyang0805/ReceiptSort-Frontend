'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SuccessMessageProps {
  success: boolean
  canceled: boolean
  sessionId?: string
  currentCredits: number
}

export function SuccessMessage({ success, canceled, sessionId, currentCredits }: SuccessMessageProps) {
  const t = useTranslations('dashboard.credits')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (success && sessionId) {
      // Fetch session details to get credits added
      fetchSessionDetails()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, sessionId])

  const fetchSessionDetails = async () => {
    try {
      // In a real implementation, you would call an API endpoint
      // that uses the server-side Stripe client to retrieve the session
      // For now, we'll extract from URL or use a simplified approach

      // You could create a new API endpoint: GET /api/stripe/session/[id]
      // For this demo, we'll just show the current balance
      setLoading(false)
    } catch (error) {
      console.error('Error fetching session:', error)
      setLoading(false)
    }
  }

  if (loading && success) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>{t('paymentSuccess.processing')}</AlertTitle>
        <AlertDescription>
          {t('paymentSuccess.processingDescription')}
        </AlertDescription>
      </Alert>
    )
  }

  if (success) {
    return (
      <Alert className="border-green-600 bg-green-50 text-green-900">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>{t('paymentSuccess.title')} 🎉</AlertTitle>
        <AlertDescription>
          {t('paymentSuccess.description', { credits: currentCredits })}
        </AlertDescription>
      </Alert>
    )
  }

  if (canceled) {
    return (
      <Alert className="border-yellow-600 bg-yellow-50 text-yellow-900">
        <XCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>{t('paymentCanceled.title')}</AlertTitle>
        <AlertDescription>
          {t('paymentCanceled.description')}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
