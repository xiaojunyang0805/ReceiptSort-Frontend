'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface UploadFile {
  file: File
  id: string
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'converting' | 'success' | 'error'
  error?: string
  receiptId?: string // Store receipt ID for processing
  confidenceScore?: number // Track confidence for automatic conversion decision
  needsManualConversion?: boolean // Flag for showing manual conversion dialog
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
}

export default function ReceiptUpload() {
  const t = useTranslations('dashboard.uploadSection')
  const router = useRouter()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large (max 10MB)`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} has invalid file type`)
        } else {
          toast.error(`${file.name}: ${error.message}`)
        }
      })
    })

    // Add accepted files to upload queue
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending',
    }))

    setUploadFiles((prev) => [...prev, ...newFiles])
  }, [])

  // Auto-upload files when they're added
  useEffect(() => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length > 0 && !isUploading) {
      handleUpload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadFiles])

  // Redirect to receipts page when all uploads are complete
  useEffect(() => {
    const allComplete = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success' || f.status === 'error')
    const hasSuccess = uploadFiles.some(f => f.status === 'success')

    if (allComplete && hasSuccess && !isUploading) {
      // Wait a brief moment to show success state, then redirect
      const timer = setTimeout(() => {
        router.push('/receipts')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [uploadFiles, isUploading, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
    multiple: true,
  })

  const removeFile = (id: string) => {
    setUploadFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  /**
   * Automatically convert PDF to PNG and re-upload for better extraction
   * This reuses the proven manual conversion workflow automatically
   */
  const automaticPdfConversion = async (uploadFileId: string, pdfFile: File, receiptId: string) => {
    try {
      console.log('[ReceiptUpload] Starting automatic PDF-to-PNG conversion...')

      // Dynamically import pdfjs (same as manual PdfConverter component)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      // Update progress: Loading PDF
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFileId ? { ...f, progress: 80 } : f))
      )

      // Read PDF file
      const arrayBuffer = await pdfFile.arrayBuffer()

      // Load PDF with CMap support for Chinese characters
      const cMapUrl = `${window.location.origin}/pdfjs/cmaps/`
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: cMapUrl,
        cMapPacked: true,
        disableFontFace: false,
        useSystemFonts: false,
      })

      const pdf = await loadingTask.promise
      console.log('[ReceiptUpload] PDF loaded, converting first page to PNG...')

      // Get first page
      const page = await pdf.getPage(1)

      // Update progress: Rendering
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFileId ? { ...f, progress: 85 } : f))
      )

      // High resolution for Chinese characters (3x scale = 216 DPI)
      const scale = 3.0
      const viewport = page.getViewport({ scale })

      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Failed to get canvas context')

      canvas.width = viewport.width
      canvas.height = viewport.height

      // White background
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Render PDF to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      console.log('[ReceiptUpload] PDF rendered to canvas, converting to PNG blob...')

      // Update progress: Converting
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFileId ? { ...f, progress: 90 } : f))
      )

      // Convert canvas to PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error('Canvas to Blob conversion failed'))
          },
          'image/png',
          1.0
        )
      })

      // Create PNG file
      const pngFileName = pdfFile.name.replace(/\.pdf$/i, '.png')
      const pngFile = new File([blob], pngFileName, { type: 'image/png' })

      console.log('[ReceiptUpload] PNG created, uploading to server...')

      // Update progress: Uploading PNG
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uploadFileId ? { ...f, progress: 95 } : f))
      )

      // Upload converted PNG to server (same as manual workflow)
      const formData = new FormData()
      formData.append('file', pngFile)

      const uploadResponse = await fetch(`/api/receipts/${receiptId}/upload-converted`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload converted PNG')
      }

      const uploadResult = await uploadResponse.json()
      console.log('[ReceiptUpload] Automatic conversion successful:', uploadResult)

      // Update to success
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileId
            ? {
                ...f,
                status: 'success',
                progress: 100,
                confidenceScore: uploadResult.confidence_score || 0.95,
              }
            : f
        )
      )

      const fileName = pdfFile.name
      toast.success(`${fileName} automatically converted and processed successfully!`)
    } catch (error) {
      console.error('[ReceiptUpload] Automatic conversion failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Automatic conversion failed'

      // Update to error
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileId
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
                progress: 0,
              }
            : f
        )
      )

      toast.error(`Automatic conversion failed: ${errorMessage}`)
    }
  }

  const processReceipt = async (uploadFileId: string, receiptId: string) => {
    try {
      // Call the process API endpoint
      const response = await fetch(`/api/receipts/${receiptId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Try to parse error, but handle case where response is not JSON
        let errorData
        try {
          errorData = await response.json()
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        throw new Error(errorData.error || 'Failed to process receipt')
      }

      // Parse response with better error handling
      let result
      try {
        const responseText = await response.text()
        console.log('Raw response length:', responseText.length)
        result = JSON.parse(responseText)
        console.log('Receipt processed successfully:', result)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Server returned invalid response. The file may be too complex to process automatically.')
      }

      // Check if automatic retry happened but confidence is still low
      const { isAutoPdfConversionEnabled, getAutoConversionThreshold } = await import('@/lib/features')
      const confidenceThreshold = getAutoConversionThreshold()
      const finalConfidence = result.confidence_score ?? 1.0
      const isPDF = result.file_name?.toLowerCase().endsWith('.pdf') ?? false

      console.log(`[ReceiptUpload] Final confidence: ${(finalConfidence * 100).toFixed(0)}%, isPDF: ${isPDF}`)

      // If automatic conversion enabled, PDF, and low confidence → automatically convert PDF to PNG
      if (isAutoPdfConversionEnabled() && isPDF && finalConfidence < confidenceThreshold) {
        console.log('[ReceiptUpload] Low confidence detected. Automatically converting PDF to PNG...')

        // Update status to converting
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFileId
              ? {
                  ...f,
                  status: 'converting',
                  progress: 75,
                  confidenceScore: finalConfidence,
                  receiptId: result.receipt_id,
                }
              : f
          )
        )

        // Trigger automatic PDF-to-PNG conversion
        const uploadFileToConvert = uploadFiles.find(f => f.id === uploadFileId)
        if (uploadFileToConvert) {
          await automaticPdfConversion(uploadFileId, uploadFileToConvert.file, result.receipt_id)
        }
      } else {
        // Normal success
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFileId
              ? {
                  ...f,
                  status: 'success',
                  progress: 100,
                  confidenceScore: finalConfidence,
                  receiptId: result.receipt_id,
                }
              : f
          )
        )

        const fileName = uploadFiles.find(f => f.id === uploadFileId)?.file.name || 'Receipt'
        toast.success(`${fileName} processed successfully!`)
      }
    } catch (error) {
      console.error('Processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'

      // Update status to error
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileId
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
                progress: 0,
              }
            : f
        )
      )

      const fileName = uploadFiles.find(f => f.id === uploadFileId)?.file.name || 'Receipt'
      toast.error(`Failed to process ${fileName}: ${errorMessage}`)
    }
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading', progress: 10 } : f))
      )

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Update progress
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, progress: 60 } : f))
      )

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('receipts').getPublicUrl(filePath)

      // Create database record
      const { data: receiptData, error: dbError } = await supabase.from('receipts').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'pending',
      }).select().single()

      if (dbError) throw dbError
      if (!receiptData) throw new Error('Failed to create receipt record')

      // Update progress - upload complete, now processing
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'processing', progress: 70, receiptId: receiptData.id } : f))
      )

      // Auto-process all files (images and PDFs)
      await processReceipt(id, receiptData.id)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
                progress: 0,
              }
            : f
        )
      )
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
    }
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)

    // Upload files sequentially
    for (const file of uploadFiles) {
      if (file.status === 'pending') {
        await uploadFile(file)
      }
    }

    setIsUploading(false)
  }

  const hasFiles = uploadFiles.length > 0
  const hasCompleted = uploadFiles.some((f) => f.status === 'success')

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          isUploading && 'cursor-not-allowed opacity-50',
          !isDragActive && !isUploading && 'hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'rounded-full p-4 bg-muted',
              isDragActive && 'bg-primary/10'
            )}
          >
            <Upload className={cn('h-8 w-8', isDragActive && 'text-primary')} />
          </div>

          <div>
            <p className="text-lg font-semibold">
              {isDragActive ? 'Drop files here' : t('dropHere')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('clickToBrowse')}
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t('supportedFormats')}</p>
            <p>{t('maxFileSize')}</p>
          </div>
        </div>
      </Card>

      {/* Upload Queue */}
      {hasFiles && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {isUploading ? 'Uploading...' : hasCompleted ? 'Upload Complete!' : 'Upload Queue'} ({uploadFiles.length})
            </h3>
            {!isUploading && hasCompleted && (
              <p className="text-sm text-muted-foreground">
                Redirecting to Receipts page...
              </p>
            )}
          </div>

          <div className="space-y-3">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                {/* Preview/Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.preview ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                      <Image
                        src={uploadFile.preview}
                        alt={uploadFile.file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    {uploadFile.status === 'processing' && ' • Processing with AI...'}
                    {uploadFile.status === 'uploading' && ' • Uploading...'}
                  </p>

                  {/* Progress Bar */}
                  {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                    <div className="mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-sm text-destructive mt-1">{uploadFile.error}</p>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
