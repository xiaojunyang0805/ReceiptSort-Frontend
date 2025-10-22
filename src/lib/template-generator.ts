import * as XLSX from 'xlsx'
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

  // 2. Load template using xlsx library (for WPS Office compatibility)
  const arrayBuffer = await fileData.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { cellStyles: true })

  console.log(`[Template Export] Loaded template with xlsx library`)
  console.log(`[Template Export] Sheet names:`, workbook.SheetNames)

  // 3. Get the specified worksheet
  const worksheet = workbook.Sheets[sheetName]
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

      // Get value from receipt
      let value: string | number | Date | null = null

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

  console.log(
    `[Template Export] Successfully populated ${receipts.length} receipts`
  )

  // 5. Generate buffer using xlsx library (WPS Office compatible)
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(buffer)
}

/**
 * Generate filename for template export
 */
export function generateTemplateExportFilename(templateName: string): string {
  const sanitized = templateName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitized}_${timestamp}.xlsx`
}
