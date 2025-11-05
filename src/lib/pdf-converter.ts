import pdf from 'pdf-parse-fork'

// NOTE: PDF to image conversion has been removed
// We now send PDFs directly to OpenAI's Vision API which has native PDF support (March 2025)
// This eliminates the need for @napi-rs/canvas, Chromium, and unpdf dependencies

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
