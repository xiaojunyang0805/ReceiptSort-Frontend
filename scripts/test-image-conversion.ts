import sharp from 'sharp'
import { Jimp } from 'jimp'
import fs from 'fs/promises'
import path from 'path'

async function testImageConversion() {
  const testFiles = [
    'test-receipts/Yang_med_01.bmp',
    'test-receipts/Yang_med_01.tif',
    'test-receipts/Yang_med_01.jpg',
    'test-receipts/Yang_med_01.gif',
  ]

  for (const testFile of testFiles) {
    console.log(`\n=== Testing ${testFile} ===`)

    try {
      const filePath = path.join(process.cwd(), testFile)
      const imageBuffer = await fs.readFile(filePath)
      console.log(`✓ Read file: ${imageBuffer.length} bytes`)

      // Try to get metadata with Sharp first
      let metadata
      try {
        metadata = await sharp(imageBuffer).metadata()
        console.log(
          `✓ Sharp Metadata: ${metadata.format}, ${metadata.width}x${metadata.height}, ` +
            `channels: ${metadata.channels}, space: ${metadata.space}`
        )
      } catch (metaError) {
        console.log('  Sharp cannot read this format, trying Jimp...')
        const jimpImage = await Jimp.read(imageBuffer)
        console.log(`✓ Jimp Metadata: ${jimpImage.width}x${jimpImage.height}`)
        metadata = { format: 'jimp-supported' }
      }

      // Try conversion with different approaches
      console.log('  Attempting conversion to JPEG...')

      // First try: Standard conversion with Sharp
      let jpegBuffer: Buffer
      try {
        jpegBuffer = await sharp(imageBuffer)
          .toColorspace('srgb')
          .normalise()
          .jpeg({
            quality: 95,
            mozjpeg: true,
          })
          .toBuffer()
      } catch (err1) {
        console.log('  Sharp standard conversion failed, trying without colorspace conversion...')
        try {
          jpegBuffer = await sharp(imageBuffer)
            .jpeg({
              quality: 95,
              mozjpeg: true,
            })
            .toBuffer()
        } catch (err2) {
          console.log('  Sharp simple conversion failed, trying Jimp as fallback...')
          const jimpImage = await Jimp.read(imageBuffer)
          jpegBuffer = await jimpImage.getBuffer('image/jpeg')
        }
      }

      console.log(`✓ Converted to JPEG: ${jpegBuffer.length} bytes`)

      // Convert to base64
      const base64 = jpegBuffer.toString('base64')
      console.log(`✓ Base64 length: ${base64.length} characters`)
      console.log(`✓ Data URL prefix: data:image/jpeg;base64,${base64.substring(0, 50)}...`)

      console.log('✅ SUCCESS - Conversion completed')
    } catch (error) {
      console.error('❌ FAILED -', error instanceof Error ? error.message : error)
      if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack)
      }
    }
  }
}

testImageConversion()
