/**
 * React hook for PDF to PNG conversion with state management
 *
 * Provides:
 * - Conversion progress tracking
 * - Error handling with user-friendly messages
 * - Preview generation
 * - Cleanup on unmount
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { convertPdfToImage, type ErrorType } from '@/lib/pdf-to-png-client'

export interface UsePdfConverterReturn {
  convertPdf: (file: File) => Promise<File | null>
  isConverting: boolean
  progress: number // 0-100
  progressMessage: string
  error: string | null
  errorType: ErrorType | null
  preview: string | null // Data URL of converted PNG
  reset: () => void
}

/**
 * Hook for converting PDF files to PNG with progress tracking
 *
 * @returns Converter functions and state
 *
 * @example
 * ```tsx
 * const { convertPdf, isConverting, progress, error } = usePdfConverter()
 *
 * const handleConvert = async () => {
 *   const pngFile = await convertPdf(pdfFile)
 *   if (pngFile) {
 *     // Upload the PNG file
 *     await uploadFile(pngFile)
 *   }
 * }
 * ```
 */
export function usePdfConverter(): UsePdfConverterReturn {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Keep track of preview URL for cleanup
  const previewUrlRef = useRef<string | null>(null)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    setIsConverting(false)
    setProgress(0)
    setProgressMessage('')
    setError(null)
    setErrorType(null)

    // Revoke old preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreview(null)
  }, [])

  const convertPdf = useCallback(
    async (file: File): Promise<File | null> => {
      // Reset state
      reset()
      setIsConverting(true)

      try {
        // Progress: 0% - Starting
        setProgress(0)
        setProgressMessage('Loading PDF...')

        // Small delay to show initial progress
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Progress: 30% - Loading
        setProgress(30)
        setProgressMessage('Rendering page...')

        // Perform the actual conversion
        const result = await convertPdfToImage(file, {
          scale: 2.0, // High DPI for better OCR on Chinese characters
          page: 1,
          format: 'png',
          quality: 1.0,
        })

        if (!result.success) {
          // Conversion failed
          setError(result.error || 'Conversion failed')
          setErrorType(result.errorType || 'UNKNOWN')
          setProgress(0)
          setProgressMessage('')
          setIsConverting(false)
          return null
        }

        // Progress: 60% - Converting
        setProgress(60)
        setProgressMessage('Converting to PNG...')

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Progress: 90% - Creating preview
        setProgress(90)
        setProgressMessage('Creating preview...')

        // Create preview URL
        const pngFile = result.pngFile!
        const previewUrl = URL.createObjectURL(pngFile)

        // Store for cleanup
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
        }
        previewUrlRef.current = previewUrl
        setPreview(previewUrl)

        // Progress: 100% - Done!
        setProgress(100)
        setProgressMessage('Done!')

        // Keep "Done!" message for a moment
        await new Promise((resolve) => setTimeout(resolve, 500))

        setIsConverting(false)
        return pngFile
      } catch (err) {
        console.error('[usePdfConverter] Unexpected error:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'

        setError(errorMessage)
        setErrorType('UNKNOWN')
        setProgress(0)
        setProgressMessage('')
        setIsConverting(false)
        return null
      }
    },
    [reset]
  )

  return {
    convertPdf,
    isConverting,
    progress,
    progressMessage,
    error,
    errorType,
    preview,
    reset,
  }
}
