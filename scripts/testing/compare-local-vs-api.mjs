#!/usr/bin/env node

/**
 * Compare local export with API export to find differences
 */

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

const TEMPLATE_PATH = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'SeeNano_Declaration form  2025_Q4 Oct.xlsx')

async function compareExports() {
  console.log('=== Comparing Local vs API Export ===\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get user and receipts
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
    console.error('No completed receipts')
    return
  }

  console.log(`✓ Found ${receipts.length} receipts for user ${user.email}`)

  // Field mapping from the template analysis
  const field_mapping = {
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

  const sheet_name = 'Purchase or Expense  '  // with trailing spaces
  const start_row = 2

  // Load template
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH)
  const arrayBuffer = templateBuffer.buffer.slice(
    templateBuffer.byteOffset,
    templateBuffer.byteOffset + templateBuffer.byteLength
  )

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const worksheet = workbook.getWorksheet(sheet_name)
  if (!worksheet) {
    console.error(`Sheet "${sheet_name}" not found`)
    return
  }

  console.log(`✓ Loaded template, sheet: "${sheet_name}"`)

  // Populate receipts (same logic as API)
  receipts.forEach((receipt, index) => {
    const rowNum = start_row + index

    Object.entries(field_mapping).forEach(([field, column]) => {
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
        case 'vendor_address':
          value = receipt.vendor_address || ''
          break
        default:
          value = ''
      }

      cell.value = value

      if (field === 'receipt_date' && value instanceof Date) {
        cell.numFmt = 'yyyy-mm-dd'
      } else if (field.includes('amount') || field === 'subtotal') {
        cell.numFmt = '#,##0.00'
      }
    })
  })

  console.log('✓ Populated template with receipt data')

  // Generate buffer (same as API)
  const buffer = await workbook.xlsx.writeBuffer()

  console.log(`\n✓ Generated buffer: ${buffer.byteLength} bytes`)

  // Save to file
  const outputPath = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'LOCAL_EXPORT_COMPARISON.xlsx')
  fs.writeFileSync(outputPath, buffer)

  console.log(`✓ Saved to: ${outputPath}`)

  // Inspect the buffer
  console.log('\n=== Buffer Inspection ===')
  console.log('Buffer type:', buffer.constructor.name)
  console.log('First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'))
  console.log('First 20 bytes (string):', buffer.slice(0, 20).toString('utf8'))

  // Check signature
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
    console.log('✓ Valid ZIP/Excel signature (PK)')
  } else {
    console.log('❌ Invalid signature!')
  }

  console.log('\n✅ Local export completed successfully!')
  console.log('\nNow try the API export and compare:')
  console.log('1. Export via the web app')
  console.log('2. Copy downloaded file to: tests/ExportTemplate/API_EXPORT_COMPARISON.xlsx')
  console.log('3. Compare both files in Excel')
  console.log('4. Compare file sizes')
}

compareExports().catch(console.error)
