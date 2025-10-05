/**
 * Receipt Extraction Testing Script
 *
 * This script tests the OpenAI Vision API extraction on sample receipts
 * and generates an accuracy report.
 *
 * Usage:
 *   npm run test:extraction
 */

import fs from 'fs'
import path from 'path'
import { extractReceiptData } from '../src/lib/openai'

interface TestReceipt {
  filename: string
  expected: {
    merchant_name: string
    amount: number
    currency: string
    date: string // YYYY-MM-DD
    category: string
  }
}

interface TestResult {
  filename: string
  success: boolean
  extracted?: {
    merchant_name: string
    amount: number
    currency: string
    receipt_date: string
    category: string
    confidence_score: number
  }
  accuracy: {
    merchant_match: boolean
    amount_match: boolean
    date_match: boolean
    category_reasonable: boolean
  }
  error?: string
  processingTime: number
}

// Ground truth data for test receipts
const testReceipts: TestReceipt[] = [
  {
    filename: 's01.webp',
    expected: {
      merchant_name: 'Starbucks',
      amount: 15.50,
      currency: 'USD',
      date: '2024-01-15',
      category: 'Food & Dining',
    },
  },
  {
    filename: 's02.png',
    expected: {
      merchant_name: 'Target',
      amount: 45.23,
      currency: 'USD',
      date: '2024-02-10',
      category: 'Shopping',
    },
  },
  {
    filename: 's03.webp',
    expected: {
      merchant_name: 'Shell',
      amount: 52.00,
      currency: 'USD',
      date: '2024-03-05',
      category: 'Transportation',
    },
  },
  // Add more as you identify ground truth
]

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
 * Check if merchant name is similar (allows minor misspellings)
 */
function isMerchantSimilar(expected: string, actual: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  const exp = normalize(expected)
  const act = normalize(actual)

  // Exact match
  if (exp === act) return true

  // Check if one contains the other
  if (exp.includes(act) || act.includes(exp)) return true

  // Calculate Levenshtein distance (allow 2 char difference)
  const distance = levenshteinDistance(exp, act)
  return distance <= 2
}

/**
 * Simple Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Check if category is reasonable
 */
function isCategoryReasonable(expected: string, actual: string): boolean {
  const normalize = (str: string) => str.toLowerCase()
  const exp = normalize(expected)
  const act = normalize(actual)

  // Exact match
  if (exp === act) return true

  // Category mappings (different but acceptable)
  const categoryMappings: Record<string, string[]> = {
    'food & dining': ['food', 'dining', 'restaurant', 'cafe'],
    'transportation': ['gas', 'fuel', 'parking', 'transit'],
    'shopping': ['retail', 'store', 'purchase'],
    'office supplies': ['office', 'supplies', 'stationery'],
  }

  for (const [key, values] of Object.entries(categoryMappings)) {
    if (exp.includes(key) || key.includes(exp)) {
      for (const val of values) {
        if (act.includes(val) || val.includes(act)) return true
      }
    }
  }

  return false
}

/**
 * Test a single receipt
 */
async function testReceipt(receipt: TestReceipt, receiptPath: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    console.log(`\n📄 Testing: ${receipt.filename}`)
    console.log(`   Expected: ${receipt.expected.merchant_name} - $${receipt.expected.amount}`)

    // Convert to data URL
    const dataUrl = imageToDataUrl(receiptPath)

    // Extract data
    const extracted = await extractReceiptData(dataUrl)

    const processingTime = Date.now() - startTime

    console.log(`   Extracted: ${extracted.merchant_name} - $${extracted.amount}`)
    console.log(`   Confidence: ${(extracted.confidence_score * 100).toFixed(0)}%`)
    console.log(`   Time: ${processingTime}ms`)

    // Calculate accuracy
    const merchantMatch = isMerchantSimilar(receipt.expected.merchant_name, extracted.merchant_name)
    const amountMatch = Math.abs(receipt.expected.amount - extracted.amount) < 0.01
    const dateMatch = receipt.expected.date === extracted.receipt_date
    const categoryReasonable = isCategoryReasonable(receipt.expected.category, extracted.category)

    console.log(`   ✓ Merchant: ${merchantMatch ? '✓' : '✗'}`)
    console.log(`   ✓ Amount: ${amountMatch ? '✓' : '✗'}`)
    console.log(`   ✓ Date: ${dateMatch ? '✓' : '✗'}`)
    console.log(`   ✓ Category: ${categoryReasonable ? '✓' : '✗'}`)

    return {
      filename: receipt.filename,
      success: true,
      extracted: {
        merchant_name: extracted.merchant_name,
        amount: extracted.amount,
        currency: extracted.currency,
        receipt_date: extracted.receipt_date,
        category: extracted.category,
        confidence_score: extracted.confidence_score,
      },
      accuracy: {
        merchant_match: merchantMatch,
        amount_match: amountMatch,
        date_match: dateMatch,
        category_reasonable: categoryReasonable,
      },
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`   ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)

    return {
      filename: receipt.filename,
      success: false,
      accuracy: {
        merchant_match: false,
        amount_match: false,
        date_match: false,
        category_reasonable: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    }
  }
}

/**
 * Generate accuracy report
 */
function generateReport(results: TestResult[]): void {
  console.log('\n' + '='.repeat(60))
  console.log('📊 ACCURACY REPORT')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`Successful: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)`)
  console.log(`Failed: ${failed.length} (${((failed.length / results.length) * 100).toFixed(1)}%)`)

  if (successful.length > 0) {
    const merchantAccuracy = (successful.filter(r => r.accuracy.merchant_match).length / successful.length) * 100
    const amountAccuracy = (successful.filter(r => r.accuracy.amount_match).length / successful.length) * 100
    const dateAccuracy = (successful.filter(r => r.accuracy.date_match).length / successful.length) * 100
    const categoryAccuracy = (successful.filter(r => r.accuracy.category_reasonable).length / successful.length) * 100

    console.log('\n📈 Field Accuracy:')
    console.log(`   Merchant Name: ${merchantAccuracy.toFixed(1)}% ${merchantAccuracy >= 80 ? '✓' : '✗ (target: 80%)'
}`)
    console.log(`   Amount: ${amountAccuracy.toFixed(1)}% ${amountAccuracy >= 90 ? '✓' : '✗ (target: 90%)'}`)
    console.log(`   Date: ${dateAccuracy.toFixed(1)}% ${dateAccuracy >= 90 ? '✓' : '✗ (target: 90%)'}`)
    console.log(`   Category: ${categoryAccuracy.toFixed(1)}% ${categoryAccuracy >= 70 ? '✓' : '✗ (target: 70%)'}`)

    const avgConfidence = successful.reduce((sum, r) => sum + (r.extracted?.confidence_score || 0), 0) / successful.length
    const avgProcessingTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length

    console.log('\n⏱️  Performance:')
    console.log(`   Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`)
    console.log(`   Avg Processing Time: ${avgProcessingTime.toFixed(0)}ms`)
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:')
    failed.forEach(r => {
      console.log(`   ${r.filename}: ${r.error}`)
    })
  }

  // Save detailed results to JSON
  const reportPath = path.join(__dirname, '../test-results.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n💾 Detailed results saved to: ${reportPath}`)
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Receipt Extraction Testing')
  console.log('=' .repeat(60))

  const testDir = path.join(__dirname, '../test-receipts')

  if (!fs.existsSync(testDir)) {
    console.error(`❌ Test receipts directory not found: ${testDir}`)
    process.exit(1)
  }

  console.log(`📁 Test Directory: ${testDir}`)
  console.log(`📝 Testing ${testReceipts.length} receipts\n`)

  const results: TestResult[] = []

  for (const receipt of testReceipts) {
    const receiptPath = path.join(testDir, receipt.filename)

    if (!fs.existsSync(receiptPath)) {
      console.warn(`⚠️  Receipt file not found: ${receipt.filename}`)
      continue
    }

    const result = await testReceipt(receipt, receiptPath)
    results.push(result)

    // Delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  generateReport(results)
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
