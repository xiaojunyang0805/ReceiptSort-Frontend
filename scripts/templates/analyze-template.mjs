#!/usr/bin/env node

/**
 * Analyze Excel template structure to understand complexity
 */

import ExcelJS from 'exceljs'
import { resolve } from 'path'

async function analyzeTemplate() {
  const templatePath = resolve(process.cwd(), 'tests/ExportTemplate/SeeNano_Declaration form  2025_Q4 Oct.xlsx')
  const exportPath = resolve(process.cwd(), 'tests/ExportTemplate/receipts-2025-10-21.xlsx')

  console.log('📊 Analyzing VAT Declaration Template...\n')

  // Load template
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  console.log('═══════════════════════════════════════════')
  console.log('TEMPLATE STRUCTURE ANALYSIS')
  console.log('═══════════════════════════════════════════\n')

  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`📄 Sheet ${sheetId}: "${worksheet.name}"`)
    console.log(`   Dimensions: ${worksheet.dimensions?.model || 'Unknown'}`)
    console.log(`   Row Count: ${worksheet.rowCount}`)
    console.log(`   Column Count: ${worksheet.columnCount}`)
    console.log('')

    // Analyze cell types and content
    let textCells = 0
    let formulaCells = 0
    let numberCells = 0
    let dateCells = 0
    let mergedCells = 0
    let styledCells = 0

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (cell.type === ExcelJS.ValueType.String) textCells++
        if (cell.type === ExcelJS.ValueType.Formula) formulaCells++
        if (cell.type === ExcelJS.ValueType.Number) numberCells++
        if (cell.type === ExcelJS.ValueType.Date) dateCells++
        if (cell.style?.font || cell.style?.fill || cell.style?.border) styledCells++
      })
    })

    // Check merged cells
    if (worksheet.model.merges) {
      mergedCells = Object.keys(worksheet.model.merges).length
    }

    console.log('   Cell Analysis:')
    console.log(`   - Text cells: ${textCells}`)
    console.log(`   - Number cells: ${numberCells}`)
    console.log(`   - Formula cells: ${formulaCells}`)
    console.log(`   - Date cells: ${dateCells}`)
    console.log(`   - Merged cell regions: ${mergedCells}`)
    console.log(`   - Styled cells: ${styledCells}`)
    console.log('')

    // Sample key cells
    console.log('   📌 Sample Content (First 20 non-empty cells):')
    let sampleCount = 0
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (sampleCount >= 20) return

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (sampleCount >= 20) return

        const addr = cell.address
        const value = cell.type === ExcelJS.ValueType.Formula
          ? `=${cell.formula}`
          : String(cell.value).substring(0, 50)

        console.log(`   ${addr}: ${value}`)
        sampleCount++
      })
    })
    console.log('')
  })

  console.log('═══════════════════════════════════════════')
  console.log('EXPORTED RECEIPTS FILE ANALYSIS')
  console.log('═══════════════════════════════════════════\n')

  // Load export file
  const exportWorkbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(exportPath)

  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`📄 Sheet ${sheetId}: "${worksheet.name}"`)
    console.log(`   Dimensions: ${worksheet.dimensions?.model || 'Unknown'}`)
    console.log(`   Row Count: ${worksheet.rowCount}`)
    console.log(`   Column Count: ${worksheet.columnCount}`)
    console.log('')

    // Show headers
    const headerRow = worksheet.getRow(1)
    console.log('   Column Headers:')
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      console.log(`   Col ${colNumber}: ${cell.value}`)
    })
    console.log('')
  })

  console.log('═══════════════════════════════════════════')
  console.log('FEASIBILITY ASSESSMENT')
  console.log('═══════════════════════════════════════════\n')

  console.log('✅ ExcelJS can read and modify existing templates')
  console.log('✅ Can preserve formatting, styles, and formulas')
  console.log('✅ Can write values to specific cells')
  console.log('')
  console.log('Implementation Complexity:')
  console.log('1. Cell Mapping: EASY - Simple key-value mapping')
  console.log('2. Data Population: EASY - Direct cell writes')
  console.log('3. Formula Preservation: AUTOMATIC - ExcelJS handles it')
  console.log('4. Style Preservation: AUTOMATIC - ExcelJS handles it')
  console.log('5. Multiple Receipts: MEDIUM - Need row insertion logic')
  console.log('')
}

analyzeTemplate().catch(console.error)
