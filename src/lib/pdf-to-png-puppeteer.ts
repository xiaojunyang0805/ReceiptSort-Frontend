/**
 * PDF to PNG converter using Puppeteer + Chromium
 *
 * This provides better font support than pdfjs-dist, especially for:
 * - Chinese characters with Adobe-GB1 encoding
 * - Complex font rendering
 * - Problematic PDFs that fail with standard text extraction
 *
 * Uses @sparticuz/chromium for Vercel serverless compatibility
 */

/**
 * Convert PDF to high-resolution PNG using Puppeteer/Chromium
 * Chromium has built-in font support for Chinese characters
 *
 * @param pdfUrl - URL to the PDF file (must be accessible)
 * @returns Base64 data URL of the first page as PNG image
 * @throws Error if conversion fails
 */
export async function convertPdfToPngWithChromium(pdfUrl: string): Promise<string> {
  let browser

  try {
    console.log('[Puppeteer PDF Converter] Starting PDF to PNG conversion for:', pdfUrl)

    // Dynamic imports to avoid issues during build
    const puppeteer = await import('puppeteer-core')
    const chromium = await import('@sparticuz/chromium')

    // Launch headless Chromium
    console.log('[Puppeteer PDF Converter] Launching Chromium...')
    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })

    console.log('[Puppeteer PDF Converter] Chromium launched successfully')

    // Create new page
    const page = await browser.newPage()

    // Navigate to PDF URL
    console.log('[Puppeteer PDF Converter] Loading PDF...')
    await page.goto(pdfUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Wait a bit for PDF to fully render
    await page.waitForTimeout(1000)

    console.log('[Puppeteer PDF Converter] PDF loaded, taking screenshot...')

    // Take screenshot with high quality settings
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      encoding: 'base64',
      optimizeForSpeed: false, // Prioritize quality over speed
    })

    // Convert to data URL
    const dataUrl = `data:image/png;base64,${screenshot}`
    const sizeKB = (dataUrl.length / 1024).toFixed(2)

    console.log('[Puppeteer PDF Converter] Screenshot captured successfully')
    console.log('[Puppeteer PDF Converter] Image size:', sizeKB, 'KB')
    console.log('[Puppeteer PDF Converter] Format: PNG (lossless) via Chromium rendering')

    return dataUrl

  } catch (error) {
    console.error('[Puppeteer PDF Converter] Conversion failed:', error)
    throw new Error(
      `Failed to convert PDF to PNG with Chromium: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    // Always close browser
    if (browser) {
      await browser.close()
      console.log('[Puppeteer PDF Converter] Chromium closed')
    }
  }
}
