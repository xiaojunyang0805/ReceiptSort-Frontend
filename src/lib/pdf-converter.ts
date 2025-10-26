import { createCanvas } from 'canvas'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Set worker source for server-side rendering (use string path)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'

/**
 * Convert PDF to image (PNG) for better OCR extraction
 * Uses GPT-4o Vision API which can better understand visual layout of Chinese invoices
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Base64 data URL of the first page as PNG image
 * @throws Error if conversion fails
 */
export async function convertPdfToImage(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Converter] Starting PDF to image conversion for URL:', pdfUrl)

    // Fetch the PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('[PDF Converter] PDF fetched, size:', arrayBuffer.byteLength, 'bytes')

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdfDocument = await loadingTask.promise
    console.log('[PDF Converter] PDF loaded, pages:', pdfDocument.numPages)

    // Get first page
    const page = await pdfDocument.getPage(1)

    // Get viewport at 1x scale (original size)
    // Lower scale = smaller file size for Vision API
    let viewport = page.getViewport({ scale: 1.0 })

    // Limit maximum dimensions to prevent huge images
    const MAX_DIMENSION = 1600 // pixels
    const maxScale = Math.min(
      MAX_DIMENSION / viewport.width,
      MAX_DIMENSION / viewport.height,
      1.0 // Never upscale
    )

    if (maxScale < 1.0) {
      console.log('[PDF Converter] Scaling down large PDF:', viewport.width, 'x', viewport.height, '-> scale', maxScale)
      viewport = page.getViewport({ scale: maxScale })
    }

    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any,
    }

    await page.render(renderContext).promise
    console.log('[PDF Converter] Page rendered to canvas')

    // Convert canvas to base64 JPEG with aggressive compression
    // Quality 0.85 = good balance between size and quality for documents
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const sizeKB = (dataUrl.length / 1024).toFixed(2)
    const sizeMB = (dataUrl.length / 1024 / 1024).toFixed(2)
    console.log('[PDF Converter] PDF converted successfully')
    console.log('[PDF Converter] Canvas size:', viewport.width, 'x', viewport.height, 'pixels')
    console.log('[PDF Converter] Base64 data URL size:', sizeKB, 'KB (', sizeMB, 'MB )')
    console.log('[PDF Converter] Format: JPEG (quality: 0.85)')

    // Warn if still too large (Vision API has ~20MB limit for base64)
    if (dataUrl.length > 15 * 1024 * 1024) {
      console.warn('[PDF Converter] WARNING: Image is very large (>15MB), may cause issues with Vision API')
    }

    return dataUrl
  } catch (error) {
    console.error('[PDF Converter] PDF to image conversion failed:', error)
    throw new Error(
      `Failed to convert PDF to image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Legacy text extraction (kept for backwards compatibility)
 * @deprecated Use convertPdfToImage for better accuracy with Chinese invoices
 */
export async function extractTextFromPdf(_pdfUrl: string): Promise<string> {
  // Redirect to image conversion for better results
  throw new Error('Text extraction deprecated. Use convertPdfToImage() instead.')
}

/**
 * Check if a URL points to a PDF file based on the URL or content type
 *
 * @param url - URL to check
 * @param contentType - Optional content type hint
 * @returns true if the URL is likely a PDF
 */
export function isPdfUrl(url: string, contentType?: string): boolean {
  // Check content type if provided
  if (contentType) {
    return contentType.includes('application/pdf') || contentType.includes('pdf')
  }

  // Check URL extension
  const urlLower = url.toLowerCase()
  return urlLower.includes('.pdf') || urlLower.includes('application/pdf')
}
