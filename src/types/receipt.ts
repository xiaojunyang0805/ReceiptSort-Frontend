/**
 * Extracted receipt data from AI Vision processing
 */
export interface ExtractedReceiptData {
  /** Business/merchant name from the receipt */
  merchant_name: string

  /** Total amount (including tax) */
  amount: number

  /** Currency code (USD, EUR, GBP, etc.) */
  currency: string

  /** Receipt date in ISO format (YYYY-MM-DD), null if not found */
  receipt_date: string | null

  /** Receipt category */
  category: ReceiptCategory

  /** Tax amount if available */
  tax_amount: number | null

  /** Payment method used */
  payment_method: PaymentMethod | null

  /** AI confidence score (0-1, where 1 is highest confidence) */
  confidence_score: number

  /** Full OCR text extracted from receipt */
  raw_text: string

  // === Phase 1: Essential Fields ===

  /** Invoice/receipt number from the document */
  invoice_number: string | null

  /** Type of document (auto-detected by AI) */
  document_type: DocumentType

  /** Amount before tax (for accounting) */
  subtotal: number | null

  /** Full vendor address from the document */
  vendor_address: string | null

  /** Payment due date in ISO format (YYYY-MM-DD), for invoices/bills */
  due_date: string | null
}

/**
 * Valid document types (Phase 1: Essential Fields)
 */
export type DocumentType = 'receipt' | 'invoice' | 'medical_invoice' | 'bill'

/**
 * Valid receipt categories
 */
export type ReceiptCategory =
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Office Supplies'
  | 'Travel'
  | 'Entertainment'
  | 'Utilities'
  | 'Healthcare'
  | 'Other'

/**
 * Valid payment methods
 */
export type PaymentMethod =
  | 'Cash'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Unknown'

/**
 * Database receipt record
 */
export interface Receipt {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_url: string
  file_type: string
  file_size: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  merchant_name?: string
  total_amount?: number
  currency?: string
  receipt_date?: string
  category?: string
  tax_amount?: number
  payment_method?: string
  notes?: string
  confidence_score?: number
  raw_ocr_text?: string
  processing_error?: string
  created_at: string
  updated_at: string

  // === Phase 1: Essential Fields ===
  invoice_number?: string
  document_type?: string
  subtotal?: number
  vendor_address?: string
  due_date?: string
}
