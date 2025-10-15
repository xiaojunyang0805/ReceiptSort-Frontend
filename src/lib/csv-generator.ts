import Papa from 'papaparse'
import { format } from 'date-fns'
import { ExportTemplate, mapReceiptToTemplate, STANDARD_TEMPLATE } from './export-templates'

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

  // Phase 1: Essential Fields
  invoice_number?: string
  document_type?: string
  subtotal?: number
  vendor_address?: string
  due_date?: string

  // Phase 2: Business Invoices
  purchase_order_number?: string
  payment_reference?: string
  vendor_tax_id?: string
  line_items?: Array<{
    line_number: number
    description: string
    quantity: number
    unit_price: number
    line_total: number
    item_code?: string | null
  }>
}

/**
 * Generate CSV export from receipts
 *
 * @param receipts - Array of receipt records to export
 * @param template - Optional export template (defaults to STANDARD_TEMPLATE)
 * @returns CSV string with header row
 */
export function generateCSV(receipts: Receipt[], template?: ExportTemplate): string {
  const exportTemplate = template || STANDARD_TEMPLATE

  // Filter only completed receipts
  const completedReceipts = receipts.filter(r => r.processing_status === 'completed')

  // Sort by date (oldest first)
  const sortedReceipts = completedReceipts.sort((a, b) => {
    const dateA = a.receipt_date ? new Date(a.receipt_date).getTime() : 0
    const dateB = b.receipt_date ? new Date(b.receipt_date).getTime() : 0
    return dateA - dateB
  })

  // Transform to CSV rows using template
  const csvData = sortedReceipts.map(receipt =>
    mapReceiptToTemplate(receipt as unknown as Record<string, unknown>, exportTemplate)
  )

  // Get column labels from template
  const columns = exportTemplate.columns.map(col => col.label)

  // Generate CSV using papaparse
  const csv = Papa.unparse(csvData, {
    header: true,
    columns,
  })

  return csv
}

/**
 * Generate filename for CSV export
 * Format: receipts-YYYY-MM-DD.csv
 */
export function generateCSVFilename(): string {
  const today = format(new Date(), 'yyyy-MM-dd')
  return `receipts-${today}.csv`
}
