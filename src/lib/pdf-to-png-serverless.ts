/**
 * Serverless-compatible PDF to PNG converter using pdfjs-dist
 *
 * This uses Mozilla's PDF.js library which works in Node.js serverless environments.
 * Unlike @napi-rs/canvas or Puppeteer, this doesn't require native binaries.
 *
 * Key features:
 * - No native dependencies (works in Vercel serverless)
 * - Proper font support including Chinese characters (Adobe-GB1)
 * - High resolution rendering for better OCR accuracy
 */

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

/**
 * Polyfill browser APIs for pdfjs-dist in Node.js environment
 * pdfjs-dist expects browser Canvas APIs that don't exist in Node.js
 */
function setupNodeCanvasPolyfills() {
  // Only polyfill if not already defined (avoid errors in browser environments)
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // Simple DOMMatrix polyfill for pdfjs-dist
    // pdfjs-dist only uses basic transformation methods
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;

      constructor(init?: number[] | string) {
        if (Array.isArray(init)) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }

      translate(tx: number, ty: number) {
        this.e += tx;
        this.f += ty;
        return this;
      }

      scale(scaleX: number, scaleY?: number) {
        this.a *= scaleX;
        this.d *= (scaleY ?? scaleX);
        return this;
      }
    } as any;
  }
}

/**
 * Convert first page of PDF to PNG base64 data URL
 * Uses pdfjs-dist canvas rendering which has proper font support
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Base64 data URL of the first page as PNG image
 * @throws Error if conversion fails
 */
export async function convertPdfToPng(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF to PNG] Starting conversion for:', pdfUrl)

    // Setup polyfills for browser APIs that pdfjs-dist expects
    setupNodeCanvasPolyfills()

    // Import Node.js canvas module
    const { createCanvas, ImageData } = await import('canvas')

    // Polyfill ImageData if needed
    if (typeof globalThis.ImageData === 'undefined') {
      globalThis.ImageData = ImageData as any
    }

    // Fetch the PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('[PDF to PNG] PDF fetched, size:', arrayBuffer.byteLength, 'bytes')

    // Load PDF document
    const loadingTask = getDocument({
      data: arrayBuffer,
      useSystemFonts: false, // Don't use system fonts - causes issues in serverless
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/',
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true, // Use compressed CMaps for Chinese fonts (Adobe-GB1)
    })

    const pdfDocument = await loadingTask.promise
    console.log('[PDF to PNG] PDF loaded, pages:', pdfDocument.numPages)

    // Get first page
    const page = await pdfDocument.getPage(1)
    console.log('[PDF to PNG] Got first page')

    // Set rendering resolution
    // Higher scale = better quality but larger file size
    // 2.0 is a good balance for OCR (equivalent to 144 DPI)
    const scale = 2.0
    const viewport = page.getViewport({ scale })

    console.log('[PDF to PNG] Viewport size:', {
      width: viewport.width,
      height: viewport.height,
      scale
    })

    // Create canvas using Node.js canvas module
    const canvas = createCanvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // Render PDF page to canvas
    // Type casting is necessary because pdfjs-dist expects browser Canvas API
    // but we're using Node.js canvas which has compatible interface
    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any,
    }

    await page.render(renderContext).promise
    console.log('[PDF to PNG] Page rendered to canvas')

    // Convert canvas to PNG base64 data URL
    const dataUrl = canvas.toDataURL('image/png')
    const sizeKB = (dataUrl.length / 1024).toFixed(2)

    console.log('[PDF to PNG] Conversion complete')
    console.log('[PDF to PNG] Image size:', sizeKB, 'KB')
    console.log('[PDF to PNG] Resolution:', `${viewport.width}x${viewport.height} @ ${scale}x scale`)

    return dataUrl

  } catch (error) {
    console.error('[PDF to PNG] Conversion failed:', error)
    throw new Error(
      `Failed to convert PDF to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if a URL or file path points to a PDF
 */
export function isPdfUrl(url: string, contentType?: string): boolean {
  if (contentType) {
    return contentType.includes('application/pdf') || contentType.includes('pdf')
  }

  const urlLower = url.toLowerCase()
  return urlLower.endsWith('.pdf') || urlLower.includes('.pdf?') || urlLower.includes('application/pdf')
}
