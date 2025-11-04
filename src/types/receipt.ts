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

  // === Phase 2: Business Invoices ===

  /** Purchase order number for business invoices */
  purchase_order_number: string | null

  /** Transaction ID, check number, or payment reference */
  payment_reference: string | null

  /** Vendor VAT/Tax ID/EIN/BTW number */
  vendor_tax_id: string | null

  /** Line items breakdown (for detailed invoices) */
  line_items: ReceiptLineItem[]

  // === Phase 3: Medical Receipts ===

  /** Patient date of birth (for medical invoices/receipts) */
  patient_dob: string | null

  /** Actual treatment or service date (for medical invoices) */
  treatment_date: string | null

  /** Insurance claim reference number */
  insurance_claim_number: string | null

  /** ICD diagnosis codes (comma-separated) */
  diagnosis_codes: string | null

  /** CPT/treatment procedure codes (comma-separated) */
  procedure_codes: string | null

  /** Healthcare provider ID (AGB code in Netherlands, NPI in USA) */
  provider_id: string | null

  /** Amount covered/paid by insurance (for medical receipts with insurance coverage) */
  insurance_covered_amount: number | null

  /** Amount patient must pay after insurance deduction (for medical receipts) */
  patient_responsibility_amount: number | null
}

/**
 * Line item from a receipt or invoice (Phase 2: Business Invoices)
 */
export interface ReceiptLineItem {
  /** Unique identifier for the line item */
  id?: string

  /** Foreign key to the receipt */
  receipt_id?: string

  /** Sequential line number (1, 2, 3...) */
  line_number: number

  /** Item description or service description */
  description: string

  /** Quantity purchased */
  quantity: number

  /** Price per unit (excluding tax) */
  unit_price: number

  /** Total for this line (quantity × unit_price) */
  line_total: number

  /** Product SKU, treatment code, CPT code, or item identifier */
  item_code?: string | null

  /** Tax rate percentage applied to this line (e.g., 21.00 for 21%) */
  tax_rate?: number | null

  /** Timestamps */
  created_at?: string
  updated_at?: string
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

  // === Phase 2: Business Invoices ===
  purchase_order_number?: string
  payment_reference?: string
  vendor_tax_id?: string
  line_items?: ReceiptLineItem[]

  // === Phase 3: Medical Receipts ===
  patient_dob?: string
  treatment_date?: string
  insurance_claim_number?: string
  diagnosis_codes?: string
  procedure_codes?: string
  provider_id?: string
}
