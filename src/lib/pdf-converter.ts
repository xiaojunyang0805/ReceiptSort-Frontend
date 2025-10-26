import pdf from 'pdf-parse-fork'

/**
 * Convert PDF to high-resolution PNG image for Vision API
 * Used as fallback when text extraction yields low confidence
 *
 * NOTE: Uses dynamic imports to avoid DOMMatrix errors in Vercel serverless
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Base64 data URL of the first page as PNG image
 * @throws Error if conversion fails
 */
export async function convertPdfToImage(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF Converter] Starting PDF to image conversion for URL:', pdfUrl)

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

    // Get viewport at 2x scale for clear text recognition (especially Chinese characters)
    let viewport = page.getViewport({ scale: 2.0 })

    // Limit maximum dimensions to prevent excessive file size
    const MAX_DIMENSION = 2400 // pixels
    const maxScale = Math.min(
      MAX_DIMENSION / viewport.width,
      MAX_DIMENSION / viewport.height,
      2.0
    )

    if (maxScale < 2.0) {
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

    // Convert canvas to base64 PNG (lossless - critical for text accuracy)
    const dataUrl = canvas.toDataURL('image/png')
    const sizeKB = (dataUrl.length / 1024).toFixed(2)
    console.log('[PDF Converter] PDF converted successfully')
    console.log('[PDF Converter] Canvas size:', viewport.width, 'x', viewport.height, 'pixels')
    console.log('[PDF Converter] Base64 data URL size:', sizeKB, 'KB')
    console.log('[PDF Converter] Format: PNG (lossless), scale: 2.0x - Optimized for text recognition')

    return dataUrl
  } catch (error) {
    console.error('[PDF Converter] PDF to image conversion failed:', error)
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
