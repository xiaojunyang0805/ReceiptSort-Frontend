/**
 * Image conversion utilities for receipt processing
 * Converts unsupported image formats (BMP, TIFF) to JPEG for OpenAI Vision API compatibility
 */

import sharp from 'sharp'

/**
 * Check if a URL/filename indicates an unsupported image format that needs conversion
 * @param url - Image URL or filename
 * @returns True if format needs conversion (BMP, TIFF, TIF)
 */
export function needsImageConversion(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return (
    lowerUrl.endsWith('.bmp') ||
    lowerUrl.endsWith('.tiff') ||
    lowerUrl.endsWith('.tif') ||
    lowerUrl.includes('.bmp?') ||
    lowerUrl.includes('.tiff?') ||
    lowerUrl.includes('.tif?')
  )
}

/**
 * Convert an image from BMP/TIFF to JPEG format for OpenAI Vision API compatibility
 * @param imageUrl - URL of the image to convert
 * @returns Data URL of the converted JPEG image
 * @throws Error if conversion fails
 */
export async function convertImageToJpeg(imageUrl: string): Promise<string> {
  try {
    console.log('[Image Converter] Converting image from URL:', imageUrl)

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`[Image Converter] Fetched image: ${imageBuffer.length} bytes`)

    // Convert to JPEG using sharp
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: 92, // High quality for better OCR
        mozjpeg: true, // Use mozjpeg for better compression
      })
      .toBuffer()

    console.log(`[Image Converter] Converted to JPEG: ${jpegBuffer.length} bytes`)

    // Convert to base64 data URL
    const base64 = jpegBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    console.log('[Image Converter] Successfully converted image to JPEG data URL')
    return dataUrl
  } catch (error) {
    console.error('[Image Converter] Conversion failed:', error)
    throw new Error(
      `Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
