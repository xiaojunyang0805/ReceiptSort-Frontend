'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PdfConverter } from './PdfConverter'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ConversionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptId: string
  pdfFileUrl: string
  pdfFileName: string
  currentConfidence: number
  onSuccess?: () => void
}

export function ConversionDialog({
  open,
  onOpenChange,
  receiptId,
  pdfFileUrl,
  pdfFileName,
  currentConfidence,
  onSuccess,
}: ConversionDialogProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pngFile, setPngFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Fetch PDF file when dialog opens
  useEffect(() => {
    if (!open || pdfFile) return

    const fetchPdfFile = async () => {
      setIsLoadingPdf(true)
      setLoadError(null)

      try {
        const response = await fetch(pdfFileUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch PDF file')
        }

        const blob = await response.blob()
        const file = new File([blob], pdfFileName, { type: 'application/pdf' })
        setPdfFile(file)
      } catch (error) {
        console.error('Error fetching PDF:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load PDF')
        toast.error('Failed to load PDF file')
      } finally {
        setIsLoadingPdf(false)
      }
    }

    fetchPdfFile()
  }, [open, pdfFile, pdfFileUrl, pdfFileName])

  const handleConversionComplete = (file: File, preview: string) => {
    setPngFile(file)
    setPreviewUrl(preview)
  }

  const handleUploadPng = async () => {
    if (!pngFile) return

    setIsUploading(true)

    try {
      // Create FormData with PNG file
      const formData = new FormData()
      formData.append('file', pngFile)
      formData.append('receipt_id', receiptId)
      formData.append('original_filename', pdfFileName)

      const response = await fetch(`/api/receipts/${receiptId}/upload-converted`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()

      toast.success('PNG uploaded and processed successfully!', {
        description: `New confidence: ${(data.confidence_score * 100).toFixed(0)}%`,
      })

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(pdfFileUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdfFileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Improve Extraction Accuracy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Low Confidence Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium">
              <strong>Current accuracy: {(currentConfidence * 100).toFixed(0)}%</strong> (Low confidence)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This PDF has font encoding issues (Adobe-GB1). Converting to PNG can improve accuracy to 95%+.
            </p>
          </div>

          {/* Loading State */}
          {isLoadingPdf && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading PDF file...</span>
            </div>
          )}

          {/* Load Error */}
          {loadError && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Error: {loadError}
              </p>
            </div>
          )}

          {/* PDF Converter */}
          {pdfFile && !pngFile && !loadError && (
            <PdfConverter
              pdfFile={pdfFile}
              onConversionComplete={handleConversionComplete}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {/* Conversion Complete - Upload PNG */}
          {pngFile && previewUrl && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  ✓ Conversion complete!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG file ready: {pngFile.name} ({(pngFile.size / 1024).toFixed(0)} KB)
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                <img src={previewUrl} alt="Converted PNG preview" className="w-full h-auto" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUploadPng} disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading & Processing...
                    </>
                  ) : (
                    'Upload PNG & Re-process'
                  )}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Manual Conversion Option */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Or convert manually:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://cloudconvert.com/pdf-to-png', '_blank')}
              >
                Open CloudConvert
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Convert the PDF to PNG using WPS Office, Adobe Reader, or online tools, then upload the PNG file
              directly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
