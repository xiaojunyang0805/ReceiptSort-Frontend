/**
 * Export Functionality Test Script
 *
 * Tests CSV and Excel exports with various data scenarios:
 * - Different receipt counts (1, 10, 100)
 * - Special characters in merchant names
 * - Null/missing fields
 * - Different currencies
 * - Performance benchmarks
 *
 * Usage: npx tsx scripts/test-export.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test user (you'll need to replace with actual user ID)
const TEST_USER_ID = 'test-user-id' // Replace with real user ID

interface TestReceipt {
  merchant_name?: string
  total_amount?: number
  currency?: string
  receipt_date?: string | null
  category?: string
  tax_amount?: number
  payment_method?: string
  notes?: string
  processing_status: 'completed' | 'pending' | 'failed'
}

// Test data scenarios
const testScenarios: { name: string; receipts: TestReceipt[] }[] = [
  {
    name: '1 Receipt - Basic',
    receipts: [
      {
        merchant_name: 'Test Coffee Shop',
        total_amount: 5.99,
        currency: 'USD',
        receipt_date: '2025-10-01',
        category: 'Food & Dining',
        tax_amount: 0.48,
        payment_method: 'Credit Card',
        notes: 'Morning coffee',
        processing_status: 'completed',
      },
    ],
  },
  {
    name: '10 Receipts - Special Characters',
    receipts: Array.from({ length: 10 }, (_, i) => ({
      merchant_name: `Test Merchant ${i + 1} with "quotes" & symbols: $@#%`,
      total_amount: Math.random() * 1000,
      currency: ['USD', 'EUR', 'GBP'][i % 3],
      receipt_date: `2025-10-${String(i + 1).padStart(2, '0')}`,
      category: ['Food & Dining', 'Transportation', 'Shopping'][i % 3] as any,
      tax_amount: Math.random() * 50,
      payment_method: 'Credit Card',
      notes: `Test note with émojis 🎉 and special chars: ñ, é, ü`,
      processing_status: 'completed',
    })),
  },
  {
    name: 'Null Fields Test',
    receipts: [
      {
        merchant_name: 'Merchant with Missing Data',
        total_amount: 100.00,
        currency: 'USD',
        receipt_date: null,
        category: undefined,
        tax_amount: undefined,
        payment_method: undefined,
        notes: undefined,
        processing_status: 'completed',
      },
    ],
  },
  {
    name: 'Different Currencies',
    receipts: [
      {
        merchant_name: 'USD Merchant',
        total_amount: 100.00,
        currency: 'USD',
        receipt_date: '2025-10-01',
        category: 'Shopping',
        processing_status: 'completed',
      },
      {
        merchant_name: 'EUR Merchant',
        total_amount: 85.50,
        currency: 'EUR',
        receipt_date: '2025-10-02',
        category: 'Shopping',
        processing_status: 'completed',
      },
      {
        merchant_name: 'GBP Merchant',
        total_amount: 75.25,
        currency: 'GBP',
        receipt_date: '2025-10-03',
        category: 'Shopping',
        processing_status: 'completed',
      },
      {
        merchant_name: 'JPY Merchant',
        total_amount: 10000,
        currency: 'JPY',
        receipt_date: '2025-10-04',
        category: 'Shopping',
        processing_status: 'completed',
      },
    ],
  },
]

async function cleanupTestReceipts() {
  console.log('🧹 Cleaning up old test receipts...')

  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .ilike('merchant_name', 'Test %')

  if (error) {
    console.error('Cleanup error:', error)
  } else {
    console.log('✅ Cleanup complete')
  }
}

async function createTestReceipts(receipts: TestReceipt[]) {
  console.log(`📝 Creating ${receipts.length} test receipts...`)

  const receiptData = receipts.map(r => ({
    user_id: TEST_USER_ID,
    file_name: `test-receipt-${Date.now()}.pdf`,
    file_path: 'test/path',
    file_url: 'https://example.com/test.pdf',
    file_type: 'application/pdf',
    file_size: 1024,
    ...r,
  }))

  const { data, error } = await supabase
    .from('receipts')
    .insert(receiptData)
    .select('id')

  if (error) {
    console.error('❌ Error creating receipts:', error)
    return []
  }

  console.log(`✅ Created ${data.length} receipts`)
  return data.map(r => r.id)
}

async function testExport(
  receiptIds: string[],
  format: 'csv' | 'excel',
  scenarioName: string
) {
  console.log(`\n🧪 Testing ${format.toUpperCase()} export: ${scenarioName}`)
  console.log(`   Receipts: ${receiptIds.length}`)

  const startTime = Date.now()

  try {
    const response = await fetch(`http://localhost:3000/api/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real test, you'd need proper auth headers
      },
      body: JSON.stringify({
        receipt_ids: receiptIds,
      }),
    })

    const elapsed = Date.now() - startTime

    if (!response.ok) {
      const error = await response.json()
      console.error(`❌ Export failed:`, error)
      return { success: false, elapsed, error }
    }

    const blob = await response.blob()
    const filename = `test-export-${scenarioName.replace(/\s+/g, '-')}-${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
    const filepath = path.join(process.cwd(), 'test-exports', filename)

    // Ensure directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'test-exports'))) {
      fs.mkdirSync(path.join(process.cwd(), 'test-exports'))
    }

    // Save file
    const buffer = Buffer.from(await blob.arrayBuffer())
    fs.writeFileSync(filepath, buffer)

    console.log(`✅ Export successful`)
    console.log(`   Time: ${elapsed}ms`)
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`)
    console.log(`   File: ${filepath}`)

    return { success: true, elapsed, size: buffer.length, filepath }
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`❌ Export error:`, error)
    return { success: false, elapsed, error }
  }
}

async function runTests() {
  console.log('🚀 Starting Export Functionality Tests\n')
  console.log('=' .repeat(60))

  // Cleanup first
  await cleanupTestReceipts()

  const results: any[] = []

  for (const scenario of testScenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`)
    console.log('-'.repeat(60))

    // Create test receipts
    const receiptIds = await createTestReceipts(scenario.receipts)

    if (receiptIds.length === 0) {
      console.error('❌ Failed to create test receipts, skipping scenario')
      continue
    }

    // Test CSV export
    const csvResult = await testExport(receiptIds, 'csv', scenario.name)
    results.push({ scenario: scenario.name, format: 'csv', ...csvResult })

    // Test Excel export
    const excelResult = await testExport(receiptIds, 'excel', scenario.name)
    results.push({ scenario: scenario.name, format: 'excel', ...excelResult })

    // Small delay between scenarios
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Performance test with 100 receipts
  console.log('\n📊 Performance Test: 100 Receipts')
  console.log('-'.repeat(60))

  const perfReceipts = Array.from({ length: 100 }, (_, i) => ({
    merchant_name: `Performance Test Merchant ${i + 1}`,
    total_amount: Math.random() * 1000,
    currency: 'USD',
    receipt_date: `2025-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}`,
    category: ['Food & Dining', 'Transportation', 'Shopping', 'Office Supplies'][i % 4] as any,
    tax_amount: Math.random() * 50,
    payment_method: 'Credit Card',
    processing_status: 'completed' as const,
  }))

  const perfIds = await createTestReceipts(perfReceipts)
  if (perfIds.length > 0) {
    const perfCsvResult = await testExport(perfIds, 'csv', '100-receipts-perf')
    const perfExcelResult = await testExport(perfIds, 'excel', '100-receipts-perf')
    results.push({ scenario: '100 Receipts', format: 'csv', ...perfCsvResult })
    results.push({ scenario: '100 Receipts', format: 'excel', ...perfExcelResult })
  }

  // Print summary
  console.log('\n📈 Test Summary')
  console.log('=' .repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`Total Tests: ${results.length}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log('')

  // Performance stats
  const csvTests = results.filter(r => r.format === 'csv' && r.success)
  const excelTests = results.filter(r => r.format === 'excel' && r.success)

  if (csvTests.length > 0) {
    const avgCsvTime = csvTests.reduce((sum, r) => sum + r.elapsed, 0) / csvTests.length
    console.log(`CSV Average Time: ${avgCsvTime.toFixed(0)}ms`)
  }

  if (excelTests.length > 0) {
    const avgExcelTime = excelTests.reduce((sum, r) => sum + r.elapsed, 0) / excelTests.length
    console.log(`Excel Average Time: ${avgExcelTime.toFixed(0)}ms`)
  }

  // Check if 100-receipt test passed performance threshold
  const perf100Test = results.find(r => r.scenario === '100 Receipts' && r.success)
  if (perf100Test) {
    const passed = perf100Test.elapsed < 5000
    console.log(`\n100 Receipt Export: ${perf100Test.elapsed}ms ${passed ? '✅ PASS' : '❌ FAIL'} (<5s threshold)`)
  }

  console.log('\n✅ Tests Complete!')
  console.log(`\nGenerated files are in: ${path.join(process.cwd(), 'test-exports')}`)
  console.log('\nManual verification needed:')
  console.log('  - Open CSV files in Excel, Google Sheets, Numbers')
  console.log('  - Open Excel files in Excel, Google Sheets, Numbers')
  console.log('  - Verify special characters display correctly')
  console.log('  - Verify formulas calculate correctly')
  console.log('  - Verify dates display as dates (not numbers)')
  console.log('  - Verify currency symbols preserved')
}

// Run tests
runTests().catch(console.error)
