import Papa from 'papaparse'
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

interface CSVRow {
  Merchant: string
  Amount: string
  Currency: string
  Date: string
  Category: string
  'Tax Amount': string
  'Payment Method': string
  Notes: string
}

/**
 * Generate CSV export from receipts
 *
 * @param receipts - Array of receipt records to export
 * @returns CSV string with header row
 */
export function generateCSV(receipts: Receipt[]): string {
  // Filter only completed receipts
  const completedReceipts = receipts.filter(r => r.processing_status === 'completed')

  // Sort by date (oldest first)
  const sortedReceipts = completedReceipts.sort((a, b) => {
    const dateA = a.receipt_date ? new Date(a.receipt_date).getTime() : 0
    const dateB = b.receipt_date ? new Date(b.receipt_date).getTime() : 0
    return dateA - dateB
  })

  // Transform to CSV rows
  const csvData: CSVRow[] = sortedReceipts.map(receipt => ({
    Merchant: receipt.merchant_name || '',
    Amount: receipt.total_amount?.toFixed(2) || '0.00',
    Currency: receipt.currency || '',
    Date: receipt.receipt_date
      ? format(new Date(receipt.receipt_date), 'MM/dd/yyyy')
      : '',
    Category: receipt.category || '',
    'Tax Amount': receipt.tax_amount?.toFixed(2) || '',
    'Payment Method': receipt.payment_method || '',
    Notes: receipt.notes || '',
  }))

  // Generate CSV using papaparse
  const csv = Papa.unparse(csvData, {
    header: true,
    columns: [
      'Merchant',
      'Amount',
      'Currency',
      'Date',
      'Category',
      'Tax Amount',
      'Payment Method',
      'Notes',
    ],
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
