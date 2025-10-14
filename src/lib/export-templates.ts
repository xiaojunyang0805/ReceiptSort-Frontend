/**
 * Export Templates for Different Accounting Software
 *
 * Provides pre-configured templates for:
 * - Standard (all fields)
 * - QuickBooks (QB-compatible format)
 * - Xero (Xero-compatible format)
 * - Simple (minimal fields)
 * - Custom (user-defined)
 */

export interface ExportColumn {
  key: string
  label: string
  required?: boolean
  format?: (value: unknown) => string
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  columns: ExportColumn[]
}

// Standard template - all fields
export const STANDARD_TEMPLATE: ExportTemplate = {
  id: 'standard',
  name: 'Standard',
  description: 'All receipt fields',
  columns: [
    // Phase 1: Document Type and Invoice Number
    { key: 'document_type', label: 'Document Type' },
    { key: 'invoice_number', label: 'Invoice Number' },

    // Core Fields
    { key: 'merchant_name', label: 'Merchant', required: true },
    { key: 'total_amount', label: 'Amount', required: true },
    { key: 'currency', label: 'Currency', required: true },
    { key: 'receipt_date', label: 'Date', required: true },
    { key: 'category', label: 'Category' },

    // Phase 1: Financial Details
    { key: 'subtotal', label: 'Subtotal (Before Tax)' },
    { key: 'tax_amount', label: 'Tax Amount' },

    // Other Fields
    { key: 'payment_method', label: 'Payment Method' },

    // Phase 1: Additional Details
    { key: 'due_date', label: 'Due Date' },
    { key: 'vendor_address', label: 'Vendor Address' },
    { key: 'notes', label: 'Notes' },
  ],
}

// QuickBooks template - QB-specific format
export const QUICKBOOKS_TEMPLATE: ExportTemplate = {
  id: 'quickbooks',
  name: 'QuickBooks',
  description: 'Format for QuickBooks import',
  columns: [
    { key: 'receipt_date', label: 'Date', required: true },
    { key: 'merchant_name', label: 'Vendor', required: true },
    { key: 'category', label: 'Account', required: true },
    { key: 'total_amount', label: 'Amount', required: true },
    { key: 'tax_amount', label: 'Tax' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'notes', label: 'Memo' },
  ],
}

// Xero template - Xero-specific format
export const XERO_TEMPLATE: ExportTemplate = {
  id: 'xero',
  name: 'Xero',
  description: 'Format for Xero import',
  columns: [
    { key: 'merchant_name', label: 'Contact Name', required: true },
    { key: 'receipt_date', label: 'Invoice Date', required: true },
    { key: 'receipt_date', label: 'Due Date', required: true }, // Same as invoice date
    { key: 'category', label: 'Account Code', required: true },
    { key: 'notes', label: 'Description' },
    { key: 'total_amount', label: 'Amount', required: true },
    { key: 'tax_amount', label: 'Tax Amount' },
  ],
}

// Simple template - minimal fields
export const SIMPLE_TEMPLATE: ExportTemplate = {
  id: 'simple',
  name: 'Simple',
  description: 'Merchant, amount, and date only',
  columns: [
    { key: 'merchant_name', label: 'Merchant', required: true },
    { key: 'total_amount', label: 'Amount', required: true },
    { key: 'receipt_date', label: 'Date', required: true },
  ],
}

// All available templates
export const EXPORT_TEMPLATES: ExportTemplate[] = [
  STANDARD_TEMPLATE,
  QUICKBOOKS_TEMPLATE,
  XERO_TEMPLATE,
  SIMPLE_TEMPLATE,
]

// Available columns for custom template
export const AVAILABLE_COLUMNS: ExportColumn[] = [
  // Phase 1: Document Information
  { key: 'document_type', label: 'Document Type' },
  { key: 'invoice_number', label: 'Invoice Number' },

  // Core Fields
  { key: 'merchant_name', label: 'Merchant', required: true },
  { key: 'total_amount', label: 'Amount', required: true },
  { key: 'currency', label: 'Currency' },
  { key: 'receipt_date', label: 'Date', required: true },
  { key: 'category', label: 'Category' },

  // Phase 1: Financial Details
  { key: 'subtotal', label: 'Subtotal (Before Tax)' },
  { key: 'tax_amount', label: 'Tax Amount' },

  // Other Fields
  { key: 'payment_method', label: 'Payment Method' },

  // Phase 1: Additional Details
  { key: 'due_date', label: 'Due Date' },
  { key: 'vendor_address', label: 'Vendor Address' },
  { key: 'notes', label: 'Notes' },
]

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): ExportTemplate | undefined {
  return EXPORT_TEMPLATES.find(t => t.id === templateId)
}

/**
 * Map receipt data to template format
 */
export function mapReceiptToTemplate(
  receipt: Record<string, unknown> | { [key: string]: unknown },
  template: ExportTemplate
): Record<string, string | number> {
  const row: Record<string, string | number> = {}

  template.columns.forEach(col => {
    let value = receipt[col.key]

    // Handle special formatting
    if (col.format) {
      value = col.format(value)
    } else {
      // Default formatting
      if (col.key === 'total_amount' || col.key === 'tax_amount') {
        value = typeof value === 'number' ? value.toFixed(2) : '0.00'
      } else if (col.key === 'receipt_date' && value) {
        // Format date as MM/DD/YYYY
        const date = new Date(value as string)
        value = date.toLocaleDateString('en-US')
      } else {
        value = value || ''
      }
    }

    row[col.label] = value as string | number
  })

  return row
}

/**
 * Create custom template from selected columns
 */
export function createCustomTemplate(selectedColumns: string[]): ExportTemplate {
  const columns = AVAILABLE_COLUMNS.filter(col =>
    selectedColumns.includes(col.key)
  )

  return {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined columns',
    columns,
  }
}

/**
 * Save template preference to localStorage
 */
export function saveTemplatePreference(templateId: string, customColumns?: string[]) {
  const preference = {
    templateId,
    customColumns: customColumns || [],
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem('export-template-preference', JSON.stringify(preference))
}

/**
 * Load template preference from localStorage
 */
export function loadTemplatePreference(): {
  templateId: string
  customColumns: string[]
} | null {
  try {
    const stored = localStorage.getItem('export-template-preference')
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}
