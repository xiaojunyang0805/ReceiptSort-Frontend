import pdf from 'pdf-parse-fork'
import { convertPdfToPngWithChromium } from './pdf-to-png-puppeteer'

/**
 * Convert PDF to high-resolution PNG image for Vision API
 * Used as fallback when text extraction yields low confidence
 *
 * Uses Chromium/Puppeteer for better font support (especially Chinese fonts with Adobe-GB1 encoding)
 * Falls back to pdfjs-dist if Chromium fails
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Base64 data URL of the first page as PNG image
 * @throws Error if conversion fails
 */
export async function convertPdfToImage(pdfUrl: string): Promise<string> {
  console.log('[PDF Converter] Starting PDF to PNG conversion')

  try {
    // Try Chromium-based conversion first (best font support)
    console.log('[PDF Converter] Attempting Chromium-based conversion (best for Chinese fonts)...')
    const result = await convertPdfToPngWithChromium(pdfUrl)
    console.log('[PDF Converter] ✓ Chromium conversion successful!')
    return result
  } catch (chromiumError) {
    console.error('[PDF Converter] ✗ Chromium conversion failed with error:', chromiumError)
    console.error('[PDF Converter] Error details:', chromiumError instanceof Error ? chromiumError.message : String(chromiumError))
    console.log('[PDF Converter] Falling back to pdfjs-dist (may have font rendering issues)...')

    // Fallback to pdfjs-dist (may have font issues but better than nothing)
    return await convertPdfToImageWithPdfJs(pdfUrl)
  }
}

/**
 * Fallback PDF-to-image converter using pdfjs-dist
 * Has limited font support (may not render Chinese fonts correctly)
 */
async function convertPdfToImageWithPdfJs(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Converter] Starting pdfjs-dist fallback conversion')

    // Dynamic imports to avoid DOMMatrix issues in Vercel
    const { createCanvas } = await import('canvas')
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

    // Set worker source for server-side rendering
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'

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

    // Get viewport at 3x scale for better clarity
    let viewport = page.getViewport({ scale: 3.0 })

    // Limit maximum dimensions to prevent excessive file size
    const MAX_DIMENSION = 3600
    const maxScale = Math.min(
      MAX_DIMENSION / viewport.width,
      MAX_DIMENSION / viewport.height,
      3.0
    )

    if (maxScale < 3.0) {
      viewport = page.getViewport({ scale: maxScale })
    }

    // Create canvas with white background
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')
    context.fillStyle = 'white'
    context.fillRect(0, 0, viewport.width, viewport.height)

    // Render PDF page to canvas
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any,
    }).promise

    // Convert to base64 PNG
    const dataUrl = canvas.toDataURL('image/png')
    console.log('[PDF Converter] pdfjs-dist conversion complete, size:', (dataUrl.length / 1024).toFixed(2), 'KB')

    return dataUrl
  } catch (error) {
    console.error('[PDF Converter] pdfjs-dist conversion failed:', error)
    throw new Error(
      `Failed to convert PDF to image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract text from PDF
 * Extracts all text content from a PDF file
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Extracted text from the PDF
 * @throws Error if extraction fails
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Converter] Starting text extraction for URL:', pdfUrl)

    // Fetch the PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[PDF Converter] PDF fetched, size:', buffer.length, 'bytes')

    // Parse PDF and extract text
    console.log('[PDF Converter] Extracting text from PDF...')
    const data = await pdf(buffer)

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF')
    }

    console.log('[PDF Converter] Text extraction complete, length:', data.text.length, 'characters')
    console.log('[PDF Converter] Number of pages:', data.numpages)

    return data.text
  } catch (error) {
    console.error('[PDF Converter] Text extraction failed:', error)
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
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
