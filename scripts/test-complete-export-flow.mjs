#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_USER_EMAIL = '601404242@qq.com'
const RECEIPTS_DIR = path.join(__dirname, '..', 'test-receipts', 'seenano_invoice')
const TEMPLATE_PATH = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'SeeNano_Declaration form  2025_Q4 Oct.xlsx')

async function testCompleteFlow() {
  console.log('=== Complete Export Flow Test ===\n')

  // 1. Get user
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', TEST_USER_EMAIL)

  if (!users || users.length === 0) {
    console.error('❌ Test user not found:', TEST_USER_EMAIL)
    return
  }

  const user = users[0]
  console.log('✓ Test user:', user.id)
  console.log('  Credits:', user.credits)
  console.log()

  // 2. Upload receipts
  console.log('--- Step 1: Upload Receipts ---')
  const receiptFiles = fs.readdirSync(RECEIPTS_DIR)
    .filter(f => f.endsWith('.pdf'))

  console.log(`Found ${receiptFiles.length} receipt files`)

  const uploadedReceiptIds = []

  for (const filename of receiptFiles) {
    const filePath = path.join(RECEIPTS_DIR, filename)
    const fileBuffer = fs.readFileSync(filePath)

    console.log(`\nUploading: ${filename} (${fileBuffer.length} bytes)`)

    // Upload to storage
    const storagePath = `${user.id}/${Date.now()}_${filename}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('  ❌ Upload failed:', uploadError.message)
      continue
    }

    console.log('  ✓ Uploaded to storage:', uploadData.path)

    // Create receipt record (file_url is required)
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/receipts/${storagePath}`

    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        file_name: filename,
        file_path: storagePath,
        file_url: publicUrl,
        file_size: fileBuffer.length,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (receiptError) {
      console.error('  ❌ Failed to create receipt record:', receiptError.message)
      continue
    }

    console.log('  ✓ Created receipt:', receipt.id)
    uploadedReceiptIds.push(receipt.id)
  }

  if (uploadedReceiptIds.length === 0) {
    console.error('\n❌ No receipts uploaded successfully')
    return
  }

  console.log(`\n✓ Uploaded ${uploadedReceiptIds.length} receipts`)

  // 3. Process receipts (simulate API call)
  console.log('\n--- Step 2: Process Receipts ---')

  for (const receiptId of uploadedReceiptIds) {
    console.log(`\nProcessing receipt: ${receiptId}`)
    console.log('  ⚠️  Skipping actual OpenAI processing (would cost credits)')
    console.log('  → Manually adding mock data...')

    // Add mock extracted data
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        merchant_name: 'SeeNano Technology BV',
        total_amount: 123.45,
        currency: 'EUR',
        receipt_date: '2025-10-01',
        category: 'Office Supplies',
        tax_amount: 23.45,
        subtotal: 100.00,
        payment_method: 'Bank Transfer',
        invoice_number: 'INV-2025-001',
        vendor_tax_id: 'NL123456789B01',
        vendor_address: 'Amsterdam, Netherlands',
        processing_status: 'completed',
        confidence_score: 0.95
      })
      .eq('id', receiptId)

    if (updateError) {
      console.error('  ❌ Failed to update:', updateError.message)
    } else {
      console.log('  ✓ Marked as completed with mock data')
    }
  }

  // 4. Check template file
  console.log('\n--- Step 3: Check Template File ---')

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('❌ Template file not found:', TEMPLATE_PATH)
    return
  }

  const templateBuffer = fs.readFileSync(TEMPLATE_PATH)
  console.log(`✓ Template file found: ${path.basename(TEMPLATE_PATH)}`)
  console.log(`  Size: ${templateBuffer.length} bytes`)

  // 5. Simulate template analysis
  console.log('\n--- Step 4: Template Analysis (Mock) ---')
  const mockAnalysis = {
    sheetName: 'Purchase or Expense',
    startRow: 2,
    fieldMapping: {
      'invoice_number': 'A',
      'merchant_name': 'B',
      'receipt_date': 'C',
      'total_amount': 'G',
      'subtotal': 'E',
      'tax_amount': 'F',
      'currency': 'H',
      'category': 'I',
      'payment_method': 'K',
      'vendor_tax_id': 'J'
    }
  }

  console.log('  Mock field mapping:', JSON.stringify(mockAnalysis.fieldMapping, null, 2))

  // 6. Test would be to call the actual API
  console.log('\n--- Step 5: Next Steps ---')
  console.log('✓ Test data prepared')
  console.log('\nReceipt IDs for testing:', uploadedReceiptIds)
  console.log('\nTo test the export:')
  console.log('  1. Login as:', TEST_USER_EMAIL)
  console.log('  2. Go to Receipts page')
  console.log('  3. Select these receipts')
  console.log('  4. Click Export → Upload template')
  console.log('  5. Upload:', path.basename(TEMPLATE_PATH))
  console.log('  6. Click "Export with Template (20 credits)"')
  console.log('\nExpected issues to check:')
  console.log('  - File corruption (cannot open in Excel)')
  console.log('  - Template not saved to database')
}

testCompleteFlow().catch(console.error)
