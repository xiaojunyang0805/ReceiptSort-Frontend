'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { ProcessingProgress } from './ProcessingProgress'
import { useTranslations } from 'next-intl'

interface ProcessAllButtonProps {
  pendingCount: number
  pendingIds: string[]
  userCredits: number
}

export function ProcessAllButton({
  pendingCount,
  pendingIds,
  userCredits,
}: ProcessAllButtonProps) {
  const t = useTranslations('dashboard.receiptsPage.processing')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({
    total: 0,
    current: 0,
    successful: 0,
    failed: 0,
  })

  const handleProcessAll = async () => {
    setIsDialogOpen(false)
    setIsProcessing(true)
    setProgress({
      total: pendingCount,
      current: 0,
      successful: 0,
      failed: 0,
    })

    // Calculate timeout: 3 minutes per receipt + 1 minute buffer
    const TIMEOUT_PER_RECEIPT_MS = 3 * 60 * 1000 // 3 minutes per receipt
    const BUFFER_MS = 60 * 1000 // 1 minute buffer
    const totalTimeout = (pendingCount * TIMEOUT_PER_RECEIPT_MS) + BUFFER_MS

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), totalTimeout)

    try {
      const response = await fetch('/api/receipts/process-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt_ids: pendingIds,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process receipts')
      }

      // Update final progress
      setProgress({
        total: result.summary.total,
        current: result.summary.total,
        successful: result.summary.successful,
        failed: result.summary.failed,
      })

      // Show summary toast
      if (result.summary.successful > 0 && result.summary.failed === 0) {
        toast.success(t('toast.successTitle'), {
          description: t('toast.successDescription', {
            successful: result.summary.successful,
            creditsUsed: result.summary.credits_used
          }),
        })
      } else if (result.summary.successful > 0 && result.summary.failed > 0) {
        toast.warning(t('toast.partialTitle'), {
          description: t('toast.partialDescription', {
            successful: result.summary.successful,
            failed: result.summary.failed,
            creditsUsed: result.summary.credits_used
          }),
        })
      } else {
        toast.error(t('toast.errorTitle'), {
          description: t('toast.errorDescription'),
        })
      }

      // Refresh the page to update receipts list
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Error processing receipts:', error)

      // Handle timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error(t('toast.failedTitle'), {
          description: `Processing timeout - Bulk processing exceeded the time limit. Some receipts may still be processing. Please refresh the page in a few minutes.`,
        })
      } else {
        toast.error(t('toast.failedTitle'), {
          description: error instanceof Error ? error.message : t('toast.unknownError'),
        })
      }
      setIsProcessing(false)
    }
  }

  const insufficientCredits = userCredits < pendingCount
  const creditsNeeded = Math.max(0, pendingCount - userCredits)

  return (
    <>
      {isProcessing && (
        <ProcessingProgress
          total={progress.total}
          current={progress.current}
          successful={progress.successful}
          failed={progress.failed}
          isProcessing={isProcessing}
        />
      )}

      <Button
        size="lg"
        onClick={() => setIsDialogOpen(true)}
        disabled={isProcessing || userCredits < 1}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('processing')}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {t('processAllButton', { count: pendingCount })}
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogDescription', { count: pendingCount })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('receiptsToProcess')}</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('creditsRequired')}</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('yourCredits')}</span>
              <span className={`font-medium ${insufficientCredits ? 'text-red-600' : ''}`}>
                {userCredits}
              </span>
            </div>

            {insufficientCredits && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {t('insufficientCreditsWarning', { creditsNeeded, userCredits })}
                </p>
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('processingTimeEstimate', { seconds: Math.ceil(pendingCount * 1.5) })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleProcessAll} disabled={userCredits < 1}>
              {insufficientCredits ? t('processPartial', { count: userCredits }) : t('processAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
