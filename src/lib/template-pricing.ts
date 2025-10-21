/**
 * Custom Export Template Pricing Configuration
 *
 * Users can create custom Excel templates for VAT declarations, accounting, etc.
 * Each template costs credits to create, but exports using templates are FREE.
 */

export const TEMPLATE_PRICING = {
  // Credit cost per template (flat rate)
  COST_PER_TEMPLATE: 20,

  // Template limits
  MAX_TEMPLATES_PER_USER: 10,
  MAX_TEMPLATE_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_TEMPLATE_FILE_SIZE_MB: 5,

  // Free operations
  EXPORT_WITH_TEMPLATE_COST: 0, // Free to export using template
  EDIT_TEMPLATE_COST: 0, // Free to edit mapping
  DELETE_TEMPLATE_COST: 0, // Free to delete (no refund)

  // Supported file types
  ALLOWED_FILE_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ],
  ALLOWED_FILE_EXTENSIONS: ['.xlsx', '.xls'],
} as const

/**
 * Calculate template creation cost
 * Currently flat rate of 20 credits
 *
 * @param existingTemplateCount - Number of templates user already has
 * @returns Credit cost for next template
 */
export function calculateTemplateCost(existingTemplateCount: number): number {
  // Flat rate pricing: 20 credits per template
  return TEMPLATE_PRICING.COST_PER_TEMPLATE
}

/**
 * Get user's template quota information
 *
 * @param userTemplatesCount - Number of templates user has
 * @returns Quota information object
 */
export function getTemplateQuota(userTemplatesCount: number): {
  used: number
  max: number
  remaining: number
  nextCost: number
  canCreate: boolean
  percentUsed: number
} {
  const used = userTemplatesCount
  const max = TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER
  const remaining = Math.max(0, max - used)
  const canCreate = used < max
  const percentUsed = max > 0 ? Math.round((used / max) * 100) : 0

  return {
    used,
    max,
    remaining,
    nextCost: calculateTemplateCost(used),
    canCreate,
    percentUsed,
  }
}

/**
 * Validate template file
 *
 * @param file - File object from upload
 * @returns Validation result with error message if invalid
 */
export function validateTemplateFile(file: File): {
  valid: boolean
  error?: string
} {
  // Check file size
  if (file.size > TEMPLATE_PRICING.MAX_TEMPLATE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${TEMPLATE_PRICING.MAX_TEMPLATE_FILE_SIZE_MB}MB limit`,
    }
  }

  // Check file type
  if (!TEMPLATE_PRICING.ALLOWED_FILE_TYPES.includes(file.type as typeof TEMPLATE_PRICING.ALLOWED_FILE_TYPES[number])) {
    // Also check by extension as backup
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!TEMPLATE_PRICING.ALLOWED_FILE_EXTENSIONS.includes(extension as typeof TEMPLATE_PRICING.ALLOWED_FILE_EXTENSIONS[number])) {
      return {
        valid: false,
        error: 'Only .xlsx and .xls files are supported',
      }
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Available receipt fields for mapping
 */
export const RECEIPT_FIELDS = [
  { key: 'invoice_number', label: 'Invoice Number', type: 'text' },
  { key: 'merchant_name', label: 'Merchant Name', type: 'text' },
  { key: 'receipt_date', label: 'Receipt Date', type: 'date' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'subtotal', label: 'Subtotal (Before Tax)', type: 'number' },
  { key: 'tax_amount', label: 'Tax Amount', type: 'number' },
  { key: 'total_amount', label: 'Total Amount', type: 'number' },
  { key: 'currency', label: 'Currency', type: 'text' },
  { key: 'payment_method', label: 'Payment Method', type: 'text' },
  { key: 'vendor_address', label: 'Vendor Address', type: 'text' },
  { key: 'vendor_tax_id', label: 'Vendor Tax ID (VAT/EIN/BTW)', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'text' },
  { key: 'document_type', label: 'Document Type', type: 'text' },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'purchase_order_number', label: 'Purchase Order Number', type: 'text' },
  { key: 'payment_reference', label: 'Payment Reference', type: 'text' },
] as const

export type ReceiptFieldKey = typeof RECEIPT_FIELDS[number]['key']
export type ReceiptFieldType = typeof RECEIPT_FIELDS[number]['type']

/**
 * Template field mapping type
 */
export interface TemplateFieldMapping {
  [key: string]: string // receipt field -> column letter (e.g., "merchant_name": "B")
}

/**
 * Template configuration type
 */
export interface TemplateConfig {
  templateId: string
  templateName: string
  sheetName: string
  startRow: number
  fieldMapping: TemplateFieldMapping
}
