'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, RefreshCw, ImageIcon } from 'lucide-react'
import { usePdfConverter } from '@/hooks/usePdfConverter'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

interface PdfRetryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptId: string
  fileName: string
  fileUrl: string
  confidenceScore: number
  onSuccess?: () => void
}

export default function PdfRetryDialog({
  open,
  onOpenChange,
  receiptId,
  fileName,
  fileUrl,
  confidenceScore,
  onSuccess,
}: PdfRetryDialogProps) {
  const t = useTranslations('pdfRetryDialog')
  const tCommon = useTranslations('common')

  const {
    convertPdf,
    isConverting,
    progress,
    progressMessage,
    error: conversionError,
    preview,
    reset,
  } = usePdfConverter()

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)

  const supabase = createClient()

  const handleConvertAndRetry = async () => {
    try {
      reset()
      setConversionComplete(false)

      // Fetch PDF
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(t('fetchFailed'))
      }
      const blob = await response.blob()
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' })

      // Convert to PNG
      const pngFile = await convertPdf(pdfFile)
      if (!pngFile) {
        throw new Error(t('conversionFailed'))
      }

      setConversionComplete(true)
      toast.success(t('conversionSuccess'))

      // Upload
      setIsUploading(true)
      setUploadProgress(10)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = 'png'
      const newFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${newFileName}`

      setUploadProgress(30)

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, pngFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(60)

      const {
        data: { publicUrl },
      } = supabase.storage.from('receipts').getPublicUrl(filePath)

      setUploadProgress(80)

      const { data: receiptData, error: dbError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          file_name: pngFile.name,
          file_path: filePath,
          file_url: publicUrl,
          file_type: pngFile.type,
          file_size: pngFile.size,
          processing_status: 'pending',
        })
        .select()
        .single()

      if (dbError) throw dbError
      if (!receiptData) throw new Error('Failed to create receipt record')

      setUploadProgress(100)
      setIsUploading(false)

      toast.success(t('uploadSuccess'))

      // Process
      setIsProcessing(true)

      const processResponse = await fetch(`/api/receipts/${receiptData.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.error || 'Failed to process receipt')
      }

      const result = await processResponse.json()
      setIsProcessing(false)

      const confidence = (result.data.confidence_score * 100).toFixed(0)
      toast.success(t('processingSuccess', { confidence }))

      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error('PDF retry error:', error)
      setIsUploading(false)
      setIsProcessing(false)
      toast.error(error instanceof Error ? error.message : t('retryFailed'))
    }
  }

  const isWorking = isConverting || isUploading || isProcessing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Low Confidence Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('lowConfidenceWarning')}:</strong> {t('currentConfidence')} {(confidenceScore * 100).toFixed(0)}%
            </AlertDescription>
          </Alert>

          {/* Conversion Progress */}
          {isConverting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{progressMessage}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Conversion Error */}
          {conversionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('conversionFailed')}:</strong> {conversionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Conversion Complete */}
          {conversionComplete && !conversionError && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>{t('conversionSuccess')}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">{t('preview')}:</span>
              </div>
              <div className="border rounded-lg overflow-hidden bg-muted max-h-96">
                <div className="relative w-full h-96">
                  <Image src={preview} alt="PNG Preview" fill className="object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{t('uploading')}</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{t('processing')}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isWorking}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleConvertAndRetry} disabled={isWorking || conversionComplete}>
              {isWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isConverting && t('converting')}
                  {isUploading && t('uploading')}
                  {isProcessing && t('processing')}
                </>
              ) : conversionComplete ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t('completed')}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('convertButton')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
