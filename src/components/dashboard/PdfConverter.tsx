'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PdfConverterProps {
  pdfFile: File
  onConversionComplete: (pngFile: File, previewUrl: string) => void
  onCancel: () => void
}

export function PdfConverter({ pdfFile, onConversionComplete, onCancel }: PdfConverterProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const convertToImage = async () => {
    setIsConverting(true)
    setError(null)
    setProgress(10)

    try {
      // Dynamic import - only loads in browser
      const pdfjsLib = await import('pdfjs-dist')

      // Set worker from CDN
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      setProgress(20)

      // Read PDF file
      const arrayBuffer = await pdfFile.arrayBuffer()
      setProgress(30)

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      setProgress(50)

      // Get first page
      const page = await pdf.getPage(1)
      setProgress(60)

      // Set up canvas with high resolution
      const scale = 2.0 // 2x for better OCR
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      canvas.width = viewport.width
      canvas.height = viewport.height
      setProgress(70)

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
      setProgress(90)

      // Convert canvas to PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error('Canvas to Blob failed'))
          },
          'image/png',
          1.0 // Max quality
        )
      })

      // Create File from Blob
      const pngFileName = pdfFile.name.replace(/\.pdf$/i, '.png')
      const pngFile = new File([blob], pngFileName, { type: 'image/png' })

      // Create preview URL
      const previewUrl = URL.createObjectURL(blob)
      setPreview(previewUrl)
      setProgress(100)

      // Wait a moment to show 100%
      await new Promise(resolve => setTimeout(resolve, 500))

      // Callback with result
      onConversionComplete(pngFile, previewUrl)

    } catch (err) {
      console.error('PDF conversion error:', err)
      setError(
        err instanceof Error
          ? `Conversion failed: ${err.message}`
          : 'Conversion failed. Please try manual conversion.'
      )
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            🔄 PDF Conversion Required
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            This PDF has font encoding issues (Adobe-GB1) that prevent accurate text extraction.
            Converting to PNG will improve accuracy from ~30% to ~95%.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!preview && !error && (
            <>
              {isConverting ? (
                <div className="space-y-3">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    {progress < 30 && "Loading PDF..."}
                    {progress >= 30 && progress < 70 && "Rendering page..."}
                    {progress >= 70 && progress < 100 && "Converting to PNG..."}
                    {progress === 100 && "Done! ✓"}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={convertToImage} size="lg" className="flex-1">
                    Convert to PNG (Recommended)
                  </Button>
                  <Button onClick={onCancel} variant="outline" size="lg">
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}

          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-600">
                ✓ Conversion successful!
              </p>
              <div className="border rounded-lg overflow-hidden bg-white">
                <img
                  src={preview}
                  alt="Converted PNG preview"
                  className="max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Preview of converted PNG. Ready to upload.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            💡 Tip: You can also manually save PDFs as PNG using WPS Office, Adobe Reader,
            or Preview app before uploading.
          </p>
        </div>
      </div>
    </div>
  )
}
