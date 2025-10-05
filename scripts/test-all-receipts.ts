/**
 * Test All Receipts - No Ground Truth Required
 *
 * This script extracts data from all test receipts and outputs results
 * for manual verification.
 */

import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { extractReceiptData } from '../src/lib/openai'

interface ExtractionResult {
  filename: string
  success: boolean
  data?: {
    merchant_name: string
    amount: number
    currency: string
    receipt_date: string
    category: string
    tax_amount: number | null
    payment_method: string | null
    confidence_score: number
    raw_text: string
  }
  error?: string
  processingTime: number
}

/**
 * Convert image to base64 data URL
 */
function imageToDataUrl(filePath: string): string {
  const imageBuffer = fs.readFileSync(filePath)
  const base64Image = imageBuffer.toString('base64')
  const ext = path.extname(filePath).toLowerCase()

  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }

  const mimeType = mimeTypes[ext] || 'image/jpeg'
  return `data:${mimeType};base64,${base64Image}`
}

/**
 * Test a single receipt
 */
async function testReceipt(filename: string, filePath: string): Promise<ExtractionResult> {
  const startTime = Date.now()

  try {
    console.log(`\n📄 Processing: ${filename}`)

    // Convert to data URL
    const dataUrl = imageToDataUrl(filePath)

    // Extract data
    const extracted = await extractReceiptData(dataUrl)

    const processingTime = Date.now() - startTime

    console.log(`   ✓ Merchant: ${extracted.merchant_name}`)
    console.log(`   ✓ Amount: $${extracted.amount} ${extracted.currency}`)
    console.log(`   ✓ Date: ${extracted.receipt_date}`)
    console.log(`   ✓ Category: ${extracted.category}`)
    console.log(`   ✓ Tax: ${extracted.tax_amount ? '$' + extracted.tax_amount : 'N/A'}`)
    console.log(`   ✓ Payment: ${extracted.payment_method || 'Unknown'}`)
    console.log(`   ✓ Confidence: ${(extracted.confidence_score * 100).toFixed(0)}%`)
    console.log(`   ✓ Time: ${processingTime}ms`)

    return {
      filename,
      success: true,
      data: {
        merchant_name: extracted.merchant_name,
        amount: extracted.amount,
        currency: extracted.currency,
        receipt_date: extracted.receipt_date,
        category: extracted.category,
        tax_amount: extracted.tax_amount,
        payment_method: extracted.payment_method,
        confidence_score: extracted.confidence_score,
        raw_text: extracted.raw_text,
      },
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`   ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

    return {
      filename,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    }
  }
}

/**
 * Generate summary report
 */
function generateReport(results: ExtractionResult[]): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 EXTRACTION RESULTS SUMMARY')
  console.log('='.repeat(80))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\nTotal Receipts: ${results.length}`)
  console.log(`Successful: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`)
  console.log(`Failed: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`)

  if (successful.length > 0) {
    const avgConfidence = successful.reduce((sum, r) => sum + (r.data?.confidence_score || 0), 0) / successful.length
    const avgProcessingTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length

    console.log('\n⏱️  Performance:')
    console.log(`   Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`)
    console.log(`   Avg Processing Time: ${avgProcessingTime.toFixed(0)}ms`)
    console.log(`   Total Time: ${(results.reduce((sum, r) => sum + r.processingTime, 0) / 1000).toFixed(1)}s`)

    console.log('\n📋 Extracted Data:')
    console.log('─'.repeat(80))
    console.log('File          | Merchant              | Amount    | Date       | Category')
    console.log('─'.repeat(80))
    successful.forEach(r => {
      if (r.data) {
        const merchant = r.data.merchant_name.padEnd(20).substring(0, 20)
        const amount = `$${r.data.amount.toFixed(2)}`.padEnd(9)
        const date = (r.data.receipt_date || 'N/A').padEnd(10)
        const category = r.data.category
        console.log(`${r.filename.padEnd(13)} | ${merchant} | ${amount} | ${date} | ${category}`)
      }
    })
    console.log('─'.repeat(80))
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Extractions:')
    failed.forEach(r => {
      console.log(`   ${r.filename}: ${r.error}`)
    })
  }

  // Save detailed results to JSON
  const reportPath = path.join(__dirname, '../test-extraction-results.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n💾 Detailed results saved to: test-extraction-results.json`)

  // Save CSV for easy review
  const csvPath = path.join(__dirname, '../test-extraction-results.csv')
  const csvHeader = 'filename,merchant_name,amount,currency,date,category,tax_amount,payment_method,confidence_score,processing_time_ms,success,error\n'
  const csvRows = results.map(r => {
    if (r.success && r.data) {
      return `${r.filename},"${r.data.merchant_name}",${r.data.amount},${r.data.currency},${r.data.receipt_date},"${r.data.category}",${r.data.tax_amount || ''},"${r.data.payment_method || ''}",${r.data.confidence_score},${r.processingTime},true,`
    } else {
      return `${r.filename},,,,,,,,${r.processingTime},false,"${r.error || ''}"`
    }
  }).join('\n')
  fs.writeFileSync(csvPath, csvHeader + csvRows)
  console.log(`💾 CSV results saved to: test-extraction-results.csv`)
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Testing Receipt Extraction on All Sample Receipts')
  console.log('='.repeat(80))

  const testDir = path.join(__dirname, '../test-receipts')

  if (!fs.existsSync(testDir)) {
    console.error(`❌ Test receipts directory not found: ${testDir}`)
    process.exit(1)
  }

  // Get all image files
  const files = fs.readdirSync(testDir).filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  ).sort()

  console.log(`📁 Test Directory: ${testDir}`)
  console.log(`📝 Found ${files.length} receipt images\n`)

  const results: ExtractionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const filePath = path.join(testDir, filename)

    console.log(`[${i + 1}/${files.length}]`)
    const result = await testReceipt(filename, filePath)
    results.push(result)

    // Delay between requests to avoid rate limits (1 second)
    if (i < files.length - 1) {
      console.log('   ⏳ Waiting 1 second...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  generateReport(results)
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
