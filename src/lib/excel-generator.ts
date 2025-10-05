import ExcelJS from 'exceljs'
import { format } from 'date-fns'

interface Receipt {
  id: string
  merchant_name?: string
  total_amount?: number
  currency?: string
  receipt_date?: string | null
  category?: string
  tax_amount?: number
  payment_method?: string
  notes?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

/**
 * Generate Excel workbook from receipts with advanced formatting
 *
 * @param receipts - Array of receipt records to export
 * @returns Excel file as Buffer
 */
export async function generateExcel(receipts: Receipt[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'ReceiptSort'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Filter only completed receipts and sort by date
  const completedReceipts = receipts
    .filter(r => r.processing_status === 'completed')
    .sort((a, b) => {
      const dateA = a.receipt_date ? new Date(a.receipt_date).getTime() : 0
      const dateB = b.receipt_date ? new Date(b.receipt_date).getTime() : 0
      return dateA - dateB
    })

  // Create main receipts worksheet
  const worksheet = workbook.addWorksheet('Receipts', {
    views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
  })

  // Define columns
  worksheet.columns = [
    { header: 'Merchant', key: 'merchant', width: 25 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Tax', key: 'tax', width: 12 },
    { header: 'Payment Method', key: 'payment', width: 16 },
    { header: 'Notes', key: 'notes', width: 30 },
  ]

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // Blue
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 20

  // Add data rows
  completedReceipts.forEach((receipt, index) => {
    const row = worksheet.addRow({
      merchant: receipt.merchant_name || '',
      amount: receipt.total_amount || 0,
      currency: receipt.currency || '',
      date: receipt.receipt_date ? new Date(receipt.receipt_date) : null,
      category: receipt.category || '',
      tax: receipt.tax_amount || null,
      payment: receipt.payment_method || '',
      notes: receipt.notes || '',
    })

    // Alternating row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }, // Light gray
      }
    }

    // Format amount and tax columns
    row.getCell('amount').numFmt = '$#,##0.00'
    row.getCell('tax').numFmt = '$#,##0.00'

    // Format date column
    if (receipt.receipt_date) {
      row.getCell('date').numFmt = 'mm/dd/yyyy'
    }

    // Conditional formatting: amounts > $100 in bold
    if (receipt.total_amount && receipt.total_amount > 100) {
      row.getCell('amount').font = { bold: true }
    }
  })

  // Add total row
  const totalRowNum = completedReceipts.length + 2
  const totalRow = worksheet.getRow(totalRowNum)

  totalRow.getCell('merchant').value = 'TOTAL'
  totalRow.getCell('merchant').font = { bold: true, size: 12 }

  // SUM formula for amounts
  totalRow.getCell('amount').value = {
    formula: `SUM(B2:B${totalRowNum - 1})`,
    result: completedReceipts.reduce((sum, r) => sum + (r.total_amount || 0), 0),
  }
  totalRow.getCell('amount').numFmt = '$#,##0.00'
  totalRow.getCell('amount').font = { bold: true }

  // SUM formula for taxes
  totalRow.getCell('tax').value = {
    formula: `SUM(F2:F${totalRowNum - 1})`,
    result: completedReceipts.reduce((sum, r) => sum + (r.tax_amount || 0), 0),
  }
  totalRow.getCell('tax').numFmt = '$#,##0.00'
  totalRow.getCell('tax').font = { bold: true }

  // Add border to total row
  totalRow.border = {
    top: { style: 'double', color: { argb: 'FF000000' } },
  }

  // Enable auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 },
  }

  // Add summary worksheet
  await addSummaryWorksheet(workbook, completedReceipts)

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Add summary worksheet with statistics and charts
 */
async function addSummaryWorksheet(workbook: ExcelJS.Workbook, receipts: Receipt[]) {
  const summary = workbook.addWorksheet('Summary', {
    views: [{ state: 'normal' }],
  })

  // Title
  summary.getCell('A1').value = 'Receipt Summary'
  summary.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2563EB' } }
  summary.mergeCells('A1:B1')

  // Overall statistics
  summary.getCell('A3').value = 'Total Receipts:'
  summary.getCell('B3').value = receipts.length
  summary.getCell('B3').font = { bold: true }

  const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  summary.getCell('A4').value = 'Total Amount:'
  summary.getCell('B4').value = totalAmount
  summary.getCell('B4').numFmt = '$#,##0.00'
  summary.getCell('B4').font = { bold: true }

  const totalTax = receipts.reduce((sum, r) => sum + (r.tax_amount || 0), 0)
  summary.getCell('A5').value = 'Total Tax:'
  summary.getCell('B5').value = totalTax
  summary.getCell('B5').numFmt = '$#,##0.00'
  summary.getCell('B5').font = { bold: true }

  const avgAmount = receipts.length > 0 ? totalAmount / receipts.length : 0
  summary.getCell('A6').value = 'Average Amount:'
  summary.getCell('B6').value = avgAmount
  summary.getCell('B6').numFmt = '$#,##0.00'
  summary.getCell('B6').font = { bold: true }

  // Category breakdown
  summary.getCell('A8').value = 'Breakdown by Category'
  summary.getCell('A8').font = { bold: true, size: 14 }
  summary.mergeCells('A8:C8')

  summary.getCell('A9').value = 'Category'
  summary.getCell('B9').value = 'Count'
  summary.getCell('C9').value = 'Total Amount'

  const headerRow = summary.getRow(9)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  // Calculate category totals
  const categoryTotals = receipts.reduce((acc, receipt) => {
    const category = receipt.category || 'Other'
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 }
    }
    acc[category].count++
    acc[category].total += receipt.total_amount || 0
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  let rowNum = 10
  Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([category, data]) => {
      summary.getCell(`A${rowNum}`).value = category
      summary.getCell(`B${rowNum}`).value = data.count
      summary.getCell(`C${rowNum}`).value = data.total
      summary.getCell(`C${rowNum}`).numFmt = '$#,##0.00'
      rowNum++
    })

  // Month breakdown
  const startRow = rowNum + 2
  summary.getCell(`A${startRow}`).value = 'Breakdown by Month'
  summary.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  summary.mergeCells(`A${startRow}:C${startRow}`)

  const headerRowMonth = startRow + 1
  summary.getCell(`A${headerRowMonth}`).value = 'Month'
  summary.getCell(`B${headerRowMonth}`).value = 'Count'
  summary.getCell(`C${headerRowMonth}`).value = 'Total Amount'

  const monthHeaderRow = summary.getRow(headerRowMonth)
  monthHeaderRow.font = { bold: true }
  monthHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  }

  // Calculate month totals
  const monthTotals = receipts.reduce((acc, receipt) => {
    if (!receipt.receipt_date) return acc
    const month = format(new Date(receipt.receipt_date), 'yyyy-MM')
    if (!acc[month]) {
      acc[month] = { count: 0, total: 0 }
    }
    acc[month].count++
    acc[month].total += receipt.total_amount || 0
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  rowNum = headerRowMonth + 1
  Object.entries(monthTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      summary.getCell(`A${rowNum}`).value = month
      summary.getCell(`B${rowNum}`).value = data.count
      summary.getCell(`C${rowNum}`).value = data.total
      summary.getCell(`C${rowNum}`).numFmt = '$#,##0.00'
      rowNum++
    })

  // Auto-width columns
  summary.columns = [
    { key: 'A', width: 20 },
    { key: 'B', width: 12 },
    { key: 'C', width: 15 },
  ]
}

/**
 * Generate filename for Excel export
 * Format: receipts-YYYY-MM-DD.xlsx
 */
export function generateExcelFilename(): string {
  const today = format(new Date(), 'yyyy-MM-dd')
  return `receipts-${today}.xlsx`
}
