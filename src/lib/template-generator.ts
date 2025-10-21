import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

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
  invoice_number?: string
  document_type?: string
  subtotal?: number
  vendor_address?: string
  due_date?: string
  purchase_order_number?: string
  payment_reference?: string
  vendor_tax_id?: string
}

interface TemplateConfig {
  filePath: string
  sheetName: string
  startRow: number
  fieldMapping: Record<string, string>
}

/**
 * Generate export using custom user template
 *
 * @param receipts - Array of receipt records to export
 * @param templateConfig - Template configuration
 * @returns Excel file as Buffer
 */
export async function generateTemplateExport(
  receipts: Receipt[],
  templateConfig: TemplateConfig
): Promise<Buffer> {
  const { filePath, sheetName, startRow, fieldMapping } = templateConfig

  // 1. Download template file from Supabase Storage
  const supabase = await createClient()
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('receipts')
    .download(filePath)

  if (downloadError || !fileData) {
    throw new Error('Failed to download template file')
  }

  // 2. Load template into ExcelJS
  const workbook = new ExcelJS.Workbook()
  const arrayBuffer = await fileData.arrayBuffer()
  await workbook.xlsx.load(arrayBuffer)

  // 3. Get the specified worksheet
  const worksheet = workbook.getWorksheet(sheetName)
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" not found in template`)
  }

  console.log(
    `[Template Export] Populating worksheet "${sheetName}" starting at row ${startRow}`
  )
  console.log(`[Template Export] Field mapping:`, fieldMapping)
  console.log(`[Template Export] Receipts to export: ${receipts.length}`)

  // 4. Populate template with receipt data
  receipts.forEach((receipt, index) => {
    const rowNum = startRow + index

    // Write each mapped field to its column
    Object.entries(fieldMapping).forEach(([field, column]) => {
      const cellAddress = `${column}${rowNum}`
      const cell = worksheet.getCell(cellAddress)

      // Get value from receipt
      const value = getReceiptValue(receipt, field)

      // Set cell value
      cell.value = value

      // Apply formatting based on field type
      applyFieldFormatting(cell, field, value)
    })
  })

  console.log(
    `[Template Export] Successfully populated ${receipts.length} receipts`
  )

  // 5. Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Get value from receipt for a specific field
 */
function getReceiptValue(receipt: Receipt, field: string): any {
  const value = (receipt as any)[field]

  // Convert date strings to Date objects
  if (field.includes('date') && value) {
    return new Date(value)
  }

  return value ?? ''
}

/**
 * Apply formatting to cell based on field type
 */
function applyFieldFormatting(
  cell: ExcelJS.Cell,
  field: string,
  value: any
): void {
  // Number formatting for amounts
  if (
    field === 'total_amount' ||
    field === 'subtotal' ||
    field === 'tax_amount'
  ) {
    if (typeof value === 'number') {
      cell.numFmt = '#,##0.00'
    }
  }

  // Date formatting
  if (field.includes('date') && value instanceof Date) {
    cell.numFmt = 'mm/dd/yyyy'
  }
}

/**
 * Generate filename for template export
 */
export function generateTemplateExportFilename(templateName: string): string {
  const sanitized = templateName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitized}_${timestamp}.xlsx`
}
