'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ProcessingProgressProps {
  total: number
  current: number
  successful: number
  failed: number
  isProcessing: boolean
}

export function ProcessingProgress({
  total,
  current,
  successful,
  failed,
  isProcessing,
}: ProcessingProgressProps) {
  if (!isProcessing && current === 0) return null

  const progress = (current / total) * 100
  const isDone = current === total

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessing && !isDone ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : isDone ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : null}
            <h3 className="font-medium">
              {isProcessing && !isDone
                ? `Processing receipts... (${current} of ${total})`
                : isDone
                ? 'Processing complete'
                : 'Processing'}
            </h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{successful} successful</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>{failed} failed</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
