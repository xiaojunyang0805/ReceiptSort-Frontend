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

    try {
      const response = await fetch('/api/receipts/process-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt_ids: pendingIds,
        }),
      })

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
        toast.success('All receipts processed successfully!', {
          description: `Processed ${result.summary.successful} receipt${result.summary.successful === 1 ? '' : 's'}. ${result.summary.credits_used} credit${result.summary.credits_used === 1 ? '' : 's'} used.`,
        })
      } else if (result.summary.successful > 0 && result.summary.failed > 0) {
        toast.warning('Processing completed with some failures', {
          description: `${result.summary.successful} successful, ${result.summary.failed} failed. ${result.summary.credits_used} credit${result.summary.credits_used === 1 ? '' : 's'} used.`,
        })
      } else {
        toast.error('All receipts failed to process', {
          description: 'Please check individual receipts for error details.',
        })
      }

      // Refresh the page to update receipts list
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error processing receipts:', error)
      toast.error('Failed to process receipts', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
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
            Processing...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Process All Pending ({pendingCount})
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process All Pending Receipts?</DialogTitle>
            <DialogDescription>
              This will process {pendingCount} receipt{pendingCount === 1 ? '' : 's'} using{' '}
              {pendingCount} credit{pendingCount === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Receipts to process:</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Credits required:</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your credits:</span>
              <span className={`font-medium ${insufficientCredits ? 'text-red-600' : ''}`}>
                {userCredits}
              </span>
            </div>

            {insufficientCredits && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You need {creditsNeeded} more credit{creditsNeeded === 1 ? '' : 's'} to process all receipts.
                  Only the first {userCredits} receipt{userCredits === 1 ? '' : 's'} will be processed.
                </p>
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Processing will take approximately {Math.ceil(pendingCount * 1.5)} seconds
                (1-2 seconds per receipt).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessAll} disabled={userCredits < 1}>
              {insufficientCredits ? `Process ${userCredits}` : 'Process All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
