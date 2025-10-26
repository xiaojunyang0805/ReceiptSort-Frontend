/**
 * Client-side PDF to Image converter
 * Runs in the browser using pdfjs-dist
 *
 * This solves the DOMMatrix/serverless issue by converting PDFs to images
 * BEFORE uploading to the server, so the server never has to handle PDFs.
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
// Use unpkg CDN which is more reliable for ES modules
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export interface PdfToImageOptions {
  scale?: number // Scaling factor (default: 2.0 for high quality)
  maxDimension?: number // Maximum width or height in pixels
  quality?: number // JPEG quality 0-1 (default: 0.95)
}

/**
 * Convert a PDF file to a high-quality image (PNG)
 *
 * @param pdfFile - PDF file from user upload
 * @param options - Conversion options
 * @returns Promise<File> - Image file (PNG) ready for upload
 */
export async function convertPdfToImage(
  pdfFile: File,
  options: PdfToImageOptions = {}
): Promise<File> {
  const {
    scale = 2.0, // High quality for Chinese characters
    maxDimension = 2400,
    quality = 0.95,
  } = options

  try {
    console.log('[Client PDF Converter] Starting conversion for:', pdfFile.name)

    // Read PDF file as ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    console.log('[Client PDF Converter] PDF loaded, size:', arrayBuffer.byteLength, 'bytes')

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdfDocument = await loadingTask.promise
    console.log('[Client PDF Converter] PDF loaded, pages:', pdfDocument.numPages)

    // Get first page (receipts are usually single page)
    const page = await pdfDocument.getPage(1)

    // Calculate viewport with scaling
    let viewport = page.getViewport({ scale })

    // Limit maximum dimensions
    const scaleX = Math.min(maxDimension / viewport.width, scale)
    const scaleY = Math.min(maxDimension / viewport.height, scale)
    const finalScale = Math.min(scaleX, scaleY)

    if (finalScale < scale) {
      console.log('[Client PDF Converter] Scaling down to fit max dimension')
      viewport = page.getViewport({ scale: finalScale })
    }

    console.log('[Client PDF Converter] Viewport:', viewport.width, 'x', viewport.height)

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Failed to get canvas 2D context')
    }

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas, // Required by pdfjs-dist type definitions
    }

    await page.render(renderContext as any).promise
    console.log('[Client PDF Converter] Page rendered to canvas')

    // Convert canvas to Blob (PNG for lossless quality - best for Chinese text)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/png', // PNG for lossless quality
        quality
      )
    })

    console.log('[Client PDF Converter] Canvas converted to PNG, size:', blob.size, 'bytes')

    // Create File object from Blob
    const originalName = pdfFile.name.replace(/\.pdf$/i, '')
    const imageFile = new File([blob], `${originalName}.png`, {
      type: 'image/png',
      lastModified: Date.now(),
    })

    console.log('[Client PDF Converter] Conversion complete:', imageFile.name, imageFile.size, 'bytes')

    // Clean up
    canvas.remove()

    return imageFile
  } catch (error) {
    console.error('[Client PDF Converter] Conversion failed:', error)
    throw new Error(
      `Failed to convert PDF to image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
