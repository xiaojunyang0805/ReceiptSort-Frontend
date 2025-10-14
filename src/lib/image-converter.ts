/**
 * Image conversion utilities for receipt processing
 * Converts unsupported image formats (BMP, TIFF) to JPEG for OpenAI Vision API compatibility
 */

import sharp from 'sharp'
import { Jimp } from 'jimp'

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

    // Try Sharp first (faster and better quality), fallback to Jimp for problematic formats
    let jpegBuffer: Buffer

    try {
      // Get image metadata for debugging
      const metadata = await sharp(imageBuffer).metadata()
      console.log(
        `[Image Converter] Sharp metadata: ${metadata.format}, ${metadata.width}x${metadata.height}, ` +
          `channels: ${metadata.channels}, space: ${metadata.space}`
      )

      // Try Sharp conversion with enhanced handling
      try {
        jpegBuffer = await sharp(imageBuffer)
          .toColorspace('srgb')
          .normalise()
          .jpeg({
            quality: 95,
            mozjpeg: true,
          })
          .toBuffer()
        console.log(`[Image Converter] Sharp conversion successful: ${jpegBuffer.length} bytes`)
      } catch {
        console.log('[Image Converter] Sharp colorspace conversion failed, trying simple Sharp...')
        jpegBuffer = await sharp(imageBuffer)
          .jpeg({
            quality: 95,
            mozjpeg: true,
          })
          .toBuffer()
        console.log(`[Image Converter] Simple Sharp conversion successful: ${jpegBuffer.length} bytes`)
      }
    } catch {
      // Sharp cannot handle this format (e.g., 1-bit BMP), use Jimp as fallback
      console.log(
        '[Image Converter] Sharp failed entirely, using Jimp as fallback for this format...'
      )
      const jimpImage = await Jimp.read(imageBuffer)
      console.log(`[Image Converter] Jimp loaded image: ${jimpImage.width}x${jimpImage.height}`)
      jpegBuffer = await jimpImage.getBuffer('image/jpeg')
      console.log(`[Image Converter] Jimp conversion successful: ${jpegBuffer.length} bytes`)
    }

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
