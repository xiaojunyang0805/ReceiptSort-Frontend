'use client'

/**
 * PDF Retry Dialog - Manual client-side PDF-to-PNG conversion
 *
 * This component provides a manual fallback for PDFs that have low confidence
 * after automatic server-side processing. It:
 *
 * 1. Shows warning when confidence < 70%
 * 2. Converts PDF to PNG in the browser using PDF.js
 * 3. Auto-uploads the converted PNG
 * 4. Triggers reprocessing with the PNG file
 *
 * Workflow:
 * - User clicks "Convert to PNG" button for low-confidence PDF
 * - Client-side: PDF → PNG conversion with progress tracking
 * - Auto-upload PNG to Supabase storage
 * - Auto-trigger reprocessing via API
 * - Should achieve ~95% confidence vs ~30% with text extraction
 */

import { useState } from 'react'
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
  const [newReceiptId, setNewReceiptId] = useState<string | null>(null)

  const supabase = createClient()

  const handleConvertAndRetry = async () => {
    try {
      reset()
      setConversionComplete(false)
      setNewReceiptId(null)

      // Step 1: Fetch the PDF file
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file')
      }
      const blob = await response.blob()
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' })

      // Step 2: Convert PDF to PNG (client-side)
      const pngFile = await convertPdf(pdfFile)
      if (!pngFile) {
        throw new Error('PDF conversion failed')
      }

      setConversionComplete(true)
      toast.success('PDF converted to PNG successfully!')

      // Step 3: Upload PNG to Supabase
      setIsUploading(true)
      setUploadProgress(10)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate unique filename for PNG
      const fileExt = 'png'
      const newFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${newFileName}`

      setUploadProgress(30)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, pngFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(60)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('receipts').getPublicUrl(filePath)

      setUploadProgress(80)

      // Create new database record
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
      setNewReceiptId(receiptData.id)

      toast.success('PNG uploaded successfully!')

      // Step 4: Auto-process the new PNG receipt
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
      console.log('PNG processed successfully:', result)

      setIsProcessing(false)

      toast.success(`PNG processed with ${(result.data.confidence_score * 100).toFixed(0)}% confidence!`)

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error('PDF retry error:', error)
      setIsUploading(false)
      setIsProcessing(false)
      toast.error(error instanceof Error ? error.message : 'Retry failed')
    }
  }

  const isWorking = isConverting || isUploading || isProcessing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Convert PDF to PNG for Better Accuracy
          </DialogTitle>
          <DialogDescription>
            This PDF has low confidence ({(confidenceScore * 100).toFixed(0)}%). Converting it to PNG may improve
            extraction accuracy to ~95%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Low Confidence Warning */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Low Confidence Detected:</strong> Current confidence is {(confidenceScore * 100).toFixed(0)}%
              (threshold: 70%).
              <br />
              Converting to PNG often improves OCR accuracy, especially for Chinese characters.
            </AlertDescription>
          </Alert>

          {/* File Info */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-semibold">File:</span> {fileName}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Receipt ID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{receiptId}</code>
            </div>
          </div>

          {/* Conversion Progress */}
          {isConverting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{progressMessage}</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}

          {/* Conversion Error */}
          {conversionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conversion Failed:</strong> {conversionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Conversion Complete */}
          {conversionComplete && !conversionError && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Conversion Complete!</strong> PDF successfully converted to PNG.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">Preview:</span>
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
                <span className="text-sm font-medium">Uploading PNG...</span>
              </div>
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing PNG with OpenAI...</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This may take a few seconds. Expected confidence: ~95%
              </p>
            </div>
          )}

          {/* Success State */}
          {newReceiptId && !isProcessing && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Success!</strong> PNG has been uploaded and processed successfully.
                <br />
                New receipt ID:{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">{newReceiptId}</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isWorking}>
              Cancel
            </Button>
            <Button onClick={handleConvertAndRetry} disabled={isWorking || conversionComplete}>
              {isWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isConverting && 'Converting...'}
                  {isUploading && 'Uploading...'}
                  {isProcessing && 'Processing...'}
                </>
              ) : conversionComplete ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Convert & Retry
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
