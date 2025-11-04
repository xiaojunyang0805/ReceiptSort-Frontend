/**
 * Image conversion utilities for receipt processing
 * - Converts unsupported image formats (BMP, TIFF) to JPEG for OpenAI Vision API compatibility
 * - Corrects image orientation based on EXIF data (fixes rotated phone photos)
 */

import sharp from 'sharp'

/**
 * Check if a URL/filename indicates an image that needs processing
 * This includes:
 * - Unsupported formats (BMP, TIFF) that need conversion
 * - All images (JPEG, PNG) that may need EXIF rotation correction
 *
 * @param url - Image URL or filename
 * @returns True if image needs processing (format conversion or rotation correction)
 */
export function needsImageConversion(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  // Process all common image formats to fix EXIF rotation issues
  return (
    lowerUrl.endsWith('.jpg') ||
    lowerUrl.endsWith('.jpeg') ||
    lowerUrl.endsWith('.png') ||
    lowerUrl.endsWith('.webp') ||
    lowerUrl.endsWith('.bmp') ||
    lowerUrl.endsWith('.tiff') ||
    lowerUrl.endsWith('.tif') ||
    lowerUrl.includes('.jpg?') ||
    lowerUrl.includes('.jpeg?') ||
    lowerUrl.includes('.png?') ||
    lowerUrl.includes('.webp?') ||
    lowerUrl.includes('.bmp?') ||
    lowerUrl.includes('.tiff?') ||
    lowerUrl.includes('.tif?')
  )
}

/**
 * Convert and normalize an image to JPEG format with correct orientation
 * This function:
 * 1. Converts unsupported formats (BMP/TIFF) to JPEG
 * 2. Automatically corrects image rotation based on EXIF orientation data
 * 3. Fixes rotated phone photos that appear sideways
 *
 * @param imageUrl - URL of the image to convert
 * @returns Data URL of the converted and orientation-corrected JPEG image
 * @throws Error if conversion fails
 */
export async function convertImageToJpeg(imageUrl: string): Promise<string> {
  try {
    console.log('[Image Converter] Processing image from URL:', imageUrl)

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())
    console.log(`[Image Converter] Fetched image: ${imageBuffer.length} bytes`)

    // Get image metadata for debugging
    const metadata = await sharp(imageBuffer).metadata()
    console.log(
      `[Image Converter] Original metadata: format=${metadata.format}, ` +
        `${metadata.width}x${metadata.height}, orientation=${metadata.orientation || 'undefined'}`
    )

    // CRITICAL: Use .rotate() to automatically correct EXIF orientation
    // This fixes rotated phone photos (common issue with medical invoices)
    let jpegBuffer: Buffer

    // Try Sharp conversion with EXIF rotation correction
    try {
      jpegBuffer = await sharp(imageBuffer)
        .rotate() // Automatically rotates based on EXIF orientation tag
        .toColorspace('srgb')
        .normalise()
        .jpeg({
          quality: 95,
          mozjpeg: true,
        })
        .toBuffer()
      console.log(`[Image Converter] Sharp conversion with rotation successful: ${jpegBuffer.length} bytes`)
    } catch {
      console.log('[Image Converter] Sharp colorspace conversion failed, trying simple Sharp with rotation...')
      jpegBuffer = await sharp(imageBuffer)
        .rotate() // Automatically rotates based on EXIF orientation tag
        .jpeg({
          quality: 95,
          mozjpeg: true,
        })
        .toBuffer()
      console.log(`[Image Converter] Simple Sharp conversion with rotation successful: ${jpegBuffer.length} bytes`)
    }

    // Get final metadata after rotation
    const finalMetadata = await sharp(jpegBuffer).metadata()
    console.log(
      `[Image Converter] Final metadata after rotation: ${finalMetadata.width}x${finalMetadata.height}`
    )

    // Convert to base64 data URL
    const base64 = jpegBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    console.log('[Image Converter] Successfully processed image with EXIF rotation correction')
    return dataUrl
  } catch (error) {
    console.error('[Image Converter] Conversion failed:', error)
    throw new Error(
      `Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
