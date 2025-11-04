#!/usr/bin/env node

/**
 * Test alternative: use xlsx library instead of ExcelJS
 * xlsx library is known for better compatibility
 */

import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEMPLATE_PATH = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'SeeNano_Declaration form  2025_Q4 Oct.xlsx')

async function testXLSX() {
  console.log('=== Testing xlsx library ===\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get receipts
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', '601404242@qq.com')

  const user = users[0]

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .eq('processing_status', 'completed')

  console.log(`✓ Found ${receipts.length} receipts`)

  // Read template with xlsx
  const workbook = XLSX.readFile(TEMPLATE_PATH, { cellStyles: true })

  console.log('✓ Template loaded with xlsx library')
  console.log('Sheet names:', workbook.SheetNames)

  const sheetName = 'Purchase or Expense  '
  const worksheet = workbook.Sheets[sheetName]

  if (!worksheet) {
    console.error('Sheet not found!')
    return
  }

  // Field mapping
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

  const start_row = 2

  // Populate data
  receipts.forEach((receipt, index) => {
    const rowNum = start_row + index

    Object.entries(field_mapping).forEach(([field, column]) => {
      const cellAddress = `${column}${rowNum}`

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

      // Set cell value using xlsx format
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = {}
      }

      if (value instanceof Date) {
        worksheet[cellAddress].v = value
        worksheet[cellAddress].t = 'd'
        worksheet[cellAddress].z = 'yyyy-mm-dd'
      } else if (typeof value === 'number') {
        worksheet[cellAddress].v = value
        worksheet[cellAddress].t = 'n'
        if (field.includes('amount') || field === 'subtotal') {
          worksheet[cellAddress].z = '#,##0.00'
        }
      } else {
        worksheet[cellAddress].v = value
        worksheet[cellAddress].t = 's'
      }
    })
  })

  console.log('✓ Data populated')

  // Write file with xlsx library (preserves original format better)
  const outputPath = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'XLSX_LIBRARY_TEST.xlsx')
  XLSX.writeFile(workbook, outputPath, { bookType: 'xlsx', type: 'buffer' })

  console.log(`✓ Saved to: ${outputPath}`)
  console.log('\nTry opening XLSX_LIBRARY_TEST.xlsx in WPS Office!')

  // Also check the buffer
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  console.log(`Buffer size: ${buffer.length} bytes`)
  console.log('First 20 bytes:', buffer.slice(0, 20).toString('hex'))
}

testXLSX().catch(console.error)
