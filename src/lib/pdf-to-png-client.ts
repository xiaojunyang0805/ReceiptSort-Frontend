/**
 * Robust client-side PDF to PNG converter using PDF.js via CDN
 *
 * This implementation:
 * - Uses PDF.js worker from CDN to avoid bundling issues
 * - Handles all common errors gracefully
 * - Supports high-DPI rendering for better OCR accuracy
 * - Returns PNG as File object for easy upload
 */

export type ErrorType =
  | 'WORKER_ERROR'
  | 'RENDER_ERROR'
  | 'MEMORY_ERROR'
  | 'CORS_ERROR'
  | 'UNKNOWN'

export interface ConversionResult {
  success: boolean
  pngFile?: File
  error?: string
  errorType?: ErrorType
}

export interface ConversionOptions {
  scale?: number // default 2.0 (high DPI for better OCR)
  page?: number // default 1 (first page)
  format?: 'png' | 'jpeg' // default 'png'
  quality?: number // default 1.0 (for PNG, always 1.0)
}

/**
 * Convert PDF file to PNG image using PDF.js
 *
 * @param pdfFile - PDF file from user upload
 * @param options - Conversion options
 * @returns ConversionResult with PNG file or error details
 */
export async function convertPdfToImage(
  pdfFile: File,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'This function can only run in the browser',
      errorType: 'UNKNOWN',
    }
  }

  const {
    scale = 2.0, // High DPI for better OCR on Chinese characters
    page = 1,
    format = 'png',
    quality = 1.0,
  } = options

  try {
    console.log('[PDF to PNG Client] Starting conversion:', pdfFile.name)
    console.log('[PDF to PNG Client] Options:', { scale, page, format, quality })

    // Step 1: Dynamically import PDF.js
    const pdfjsLib = await import('pdfjs-dist')
    console.log('[PDF to PNG Client] PDF.js loaded, version:', pdfjsLib.version)

    // Step 2: Set worker URL from CDN (critical for avoiding worker errors)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs'
    console.log('[PDF to PNG Client] Worker URL set to CDN')

    // Step 3: Read PDF file as ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    console.log('[PDF to PNG Client] PDF loaded, size:', arrayBuffer.byteLength, 'bytes')

    // Step 4: Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    console.log('[PDF to PNG Client] PDF parsed, pages:', pdf.numPages)

    // Validate page number
    if (page < 1 || page > pdf.numPages) {
      throw new Error(`Invalid page number ${page}. PDF has ${pdf.numPages} pages`)
    }

    // Step 5: Get the specified page
    const pdfPage = await pdf.getPage(page)
    console.log('[PDF to PNG Client] Page', page, 'loaded')

    // Step 6: Create canvas with high DPI
    const viewport = pdfPage.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    console.log('[PDF to PNG Client] Canvas created:', viewport.width, 'x', viewport.height)

    // Step 7: Get canvas context
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get canvas 2D context')
    }

    // Step 8: Render PDF page to canvas
    console.log('[PDF to PNG Client] Rendering page to canvas...')
    await pdfPage.render({
      canvasContext: context,
      viewport: viewport,
    }).promise
    console.log('[PDF to PNG Client] Page rendered successfully')

    // Step 9: Convert canvas to blob
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b)
          } else {
            reject(new Error('Canvas to Blob conversion failed'))
          }
        },
        mimeType,
        format === 'png' ? 1.0 : quality
      )
    })
    console.log('[PDF to PNG Client] Blob created, size:', blob.size, 'bytes')

    // Step 10: Create File from blob
    const fileName = pdfFile.name.replace(/\.pdf$/i, `.${format}`)
    const imageFile = new File([blob], fileName, { type: mimeType })
    console.log('[PDF to PNG Client] File created:', imageFile.name)

    // Step 11: Cleanup
    canvas.remove()
    console.log('[PDF to PNG Client] Conversion complete!')

    return {
      success: true,
      pngFile: imageFile,
    }
  } catch (error) {
    console.error('[PDF to PNG Client] Conversion failed:', error)

    // Categorize error by type
    const errorMessage = error instanceof Error ? error.message : String(error)
    let errorType: ErrorType = 'UNKNOWN'
    let userFriendlyMessage = errorMessage

    if (errorMessage.includes('worker') || errorMessage.includes('Worker')) {
      errorType = 'WORKER_ERROR'
      userFriendlyMessage = 'Failed to load PDF processor. Please try again or convert the PDF to PNG manually using your system tools.'
    } else if (errorMessage.includes('render') || errorMessage.includes('canvas')) {
      errorType = 'RENDER_ERROR'
      userFriendlyMessage = 'Failed to render PDF. The file may be corrupted or use unsupported features.'
    } else if (errorMessage.includes('memory') || errorMessage.includes('Memory')) {
      errorType = 'MEMORY_ERROR'
      userFriendlyMessage = 'PDF is too large to convert in the browser. Please convert it to PNG manually using your system tools.'
    } else if (errorMessage.includes('CORS') || errorMessage.includes('network')) {
      errorType = 'CORS_ERROR'
      userFriendlyMessage = 'Network error while loading PDF converter. Please check your internet connection.'
    }

    return {
      success: false,
      error: userFriendlyMessage,
      errorType,
    }
  }
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
