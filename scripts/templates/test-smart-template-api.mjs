#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ExcelJS from 'exceljs'

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

const TEMPLATE_PATH = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'SeeNano_Declaration form  2025_Q4 Oct.xlsx')

async function testSmartTemplateAPI() {
  console.log('=== Testing Smart Template Export API Logic ===\n')

  // Get test user and receipts
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', '601404242@qq.com')

  if (!users || users.length === 0) {
    console.error('User not found')
    return
  }

  const user = users[0]

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .eq('processing_status', 'completed')

  if (!receipts || receipts.length === 0) {
    console.error('No receipts found')
    return
  }

  console.log(`✓ Found ${receipts.length} receipts for user ${user.email}`)
  console.log(`  Credits: ${user.credits}`)
  console.log()

  // Read template file
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH)
  const base64 = templateBuffer.toString('base64')

  console.log(`✓ Template file loaded: ${path.basename(TEMPLATE_PATH)}`)
  console.log(`  Size: ${templateBuffer.length} bytes`)
  console.log(`  Base64 length: ${base64.length}`)
  console.log()

  // Simulate the API logic
  const fieldMapping = {
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

  const sheetName = 'Purchase or Expense  '  // Note: has trailing spaces!
  const startRow = 2

  console.log('--- Simulating Smart Template Export ---')
  console.log(`Sheet: ${sheetName}`)
  console.log(`Start Row: ${startRow}`)
  console.log(`Field Mapping: ${JSON.stringify(fieldMapping, null, 2)}`)
  console.log()

  try {
    // Decode and load template (same as API)
    const decodedBuffer = Buffer.from(base64, 'base64')
    console.log(`✓ Decoded base64: ${decodedBuffer.length} bytes`)

    const arrayBuffer = decodedBuffer.buffer.slice(
      decodedBuffer.byteOffset,
      decodedBuffer.byteOffset + decodedBuffer.byteLength
    )

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    console.log(`✓ Loaded workbook`)
    console.log(`  Worksheets: ${workbook.worksheets.map(ws => ws.name).join(', ')}`)

    const worksheet = workbook.getWorksheet(sheetName)
    if (!worksheet) {
      console.error(`❌ Sheet "${sheetName}" not found`)
      return
    }

    console.log(`✓ Found worksheet: ${sheetName}`)
    console.log()

    // Populate data
    console.log('--- Populating Data ---')
    receipts.forEach((receipt, index) => {
      const rowNum = startRow + index
      console.log(`\nRow ${rowNum}: ${receipt.merchant_name}`)

      Object.entries(fieldMapping).forEach(([field, column]) => {
        const cellAddress = `${column}${rowNum}`
        const cell = worksheet.getCell(cellAddress)

        let value = null

        switch (field) {
          case 'invoice_number':
            value = receipt.invoice_number || ''
            break
          case 'merchant_name':
            value = receipt.merchant_name || ''
            break
          case 'receipt_date':
            value = receipt.receipt_date ? new Date(receipt.receipt_date) : ''
            break
          case 'total_amount':
            value = receipt.total_amount || 0
            break
          case 'subtotal':
            value = receipt.subtotal || 0
            break
          case 'tax_amount':
            value = receipt.tax_amount || 0
            break
          case 'currency':
            value = receipt.currency || 'EUR'
            break
          case 'category':
            value = receipt.category || ''
            break
          case 'payment_method':
            value = receipt.payment_method || ''
            break
          case 'vendor_tax_id':
            value = receipt.vendor_tax_id || ''
            break
          default:
            value = ''
        }

        cell.value = value

        // Apply formatting
        if (field === 'receipt_date' && value instanceof Date) {
          cell.numFmt = 'yyyy-mm-dd'
        } else if (field.includes('amount') || field === 'subtotal') {
          cell.numFmt = '#,##0.00'
        }

        console.log(`  ${cellAddress} (${field}): ${value}`)
      })
    })

    console.log('\n--- Generating Output File ---')

    // Generate Excel file
    const outputBuffer = await workbook.xlsx.writeBuffer()

    console.log(`✓ Generated buffer: ${outputBuffer.length} bytes`)

    // Save to disk for testing
    const outputPath = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'TEST_OUTPUT.xlsx')
    fs.writeFileSync(outputPath, outputBuffer)

    console.log(`✓ Saved to: ${outputPath}`)
    console.log('\n✅ Test completed successfully!')
    console.log('\nTry opening the TEST_OUTPUT.xlsx file to see if it works')

  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
  }
}

testSmartTemplateAPI().catch(console.error)
