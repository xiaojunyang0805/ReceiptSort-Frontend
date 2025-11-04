#!/usr/bin/env node

/**
 * Test if we can actually open and re-save the downloaded file
 */

import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOWNLOADED_FILE = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'receipts_export_2025-10-21.xlsx')

async function testFile() {
  console.log('=== Testing Downloaded File ===\n')

  const workbook = new ExcelJS.Workbook()

  try {
    await workbook.xlsx.readFile(DOWNLOADED_FILE)
    console.log('✓ File opened successfully!')
    console.log('Worksheets:', workbook.worksheets.map(w => w.name))

    // Check the data
    const sheet = workbook.getWorksheet('Purchase or Expense  ')
    if (sheet) {
      console.log('\nData in row 2:')
      const row2 = sheet.getRow(2)
      console.log('  A2:', row2.getCell('A').value)
      console.log('  B2:', row2.getCell('B').value)
      console.log('  C2:', row2.getCell('C').value)
      console.log('  E2:', row2.getCell('E').value)
      console.log('  F2:', row2.getCell('F').value)
      console.log('  G2:', row2.getCell('G').value)
    }

    // Try re-saving it
    const fixedPath = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'FIXED_receipts_export.xlsx')
    await workbook.xlsx.writeFile(fixedPath)
    console.log('\n✓ Re-saved file to:', fixedPath)
    console.log('\nTry opening FIXED_receipts_export.xlsx in WPS Office to see if it works')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

testFile()
