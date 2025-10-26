/**
 * Test PDF-to-image conversion + Vision API extraction
 * Usage: node scripts/test-utilities/test-pdf-vision.mjs <pdf-url>
 */

import { convertPdfToImage } from '../../src/lib/pdf-converter.ts'

const pdfUrl = process.argv[2]

if (!pdfUrl) {
  console.error('Usage: node test-pdf-vision.mjs <pdf-url>')
  process.exit(1)
}

console.log('Testing PDF-to-image conversion...')
console.log('PDF URL:', pdfUrl)

try {
  const imageDataUrl = await convertPdfToImage(pdfUrl)
  console.log('\n✓ PDF converted successfully')
  console.log('Image data URL length:', imageDataUrl.length, 'characters')
  console.log('Image size (estimated):', (imageDataUrl.length / 1024).toFixed(2), 'KB')

  // Show first 100 chars
  console.log('Data URL preview:', imageDataUrl.substring(0, 100) + '...')

  console.log('\nTest completed successfully!')
} catch (error) {
  console.error('\n✗ Test failed:', error.message)
  console.error(error)
  process.exit(1)
}
