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

import { getTranslations } from 'next-intl/server'

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

    // Phase 2: Business Invoice Fields
    { key: 'purchase_order_number', label: 'Purchase Order #' },
    { key: 'payment_reference', label: 'Payment Reference' },
    { key: 'vendor_tax_id', label: 'Vendor Tax ID' },

    // Phase 1: Additional Details
    { key: 'due_date', label: 'Due Date' },
    { key: 'vendor_address', label: 'Vendor Address' },
    { key: 'notes', label: 'Notes' },

    // Phase 2: Line Items Summary (formatted as text)
    { key: 'line_items_summary', label: 'Line Items' },

    // Phase 3: Medical Receipt Fields
    { key: 'patient_dob', label: 'Patient DOB' },
    { key: 'treatment_date', label: 'Treatment Date' },
    { key: 'insurance_claim_number', label: 'Insurance Claim #' },
    { key: 'diagnosis_codes', label: 'Diagnosis Codes (ICD)' },
    { key: 'procedure_codes', label: 'Procedure Codes (CPT)' },
    { key: 'provider_id', label: 'Provider ID (AGB/NPI)' },
    { key: 'insurance_covered_amount', label: 'Insurance Covered Amount' },
    { key: 'patient_responsibility_amount', label: 'Patient Responsibility Amount' },
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

  // Phase 2: Business Invoice Fields
  { key: 'purchase_order_number', label: 'Purchase Order #' },
  { key: 'payment_reference', label: 'Payment Reference' },
  { key: 'vendor_tax_id', label: 'Vendor Tax ID' },

  // Phase 1: Additional Details
  { key: 'due_date', label: 'Due Date' },
  { key: 'vendor_address', label: 'Vendor Address' },
  { key: 'notes', label: 'Notes' },

  // Phase 2: Line Items
  { key: 'line_items_summary', label: 'Line Items' },

  // Phase 3: Medical Receipt Fields
  { key: 'patient_dob', label: 'Patient DOB' },
  { key: 'treatment_date', label: 'Treatment Date' },
  { key: 'insurance_claim_number', label: 'Insurance Claim #' },
  { key: 'diagnosis_codes', label: 'Diagnosis Codes (ICD)' },
  { key: 'procedure_codes', label: 'Procedure Codes (CPT)' },
  { key: 'provider_id', label: 'Provider ID (AGB/NPI)' },
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

/**
 * Get translated label for a column key
 * Maps database field keys to translation keys
 */
async function getTranslatedLabel(key: string, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'receiptDetails' })

  const labelMap: Record<string, string> = {
    'document_type': t('documentType'),
    'invoice_number': t('invoiceNumber'),
    'merchant_name': t('merchantName'),
    'total_amount': t('amount'),
    'currency': t('currency'),
    'receipt_date': t('receiptDate'),
    'category': t('category'),
    'subtotal': t('subtotal'),
    'tax_amount': t('taxAmount'),
    'payment_method': t('paymentMethod'),
    'purchase_order_number': t('purchaseOrderNumber'),
    'payment_reference': t('paymentReference'),
    'vendor_tax_id': t('vendorTaxId'),
    'due_date': t('dueDate'),
    'vendor_address': t('vendorAddress'),
    'notes': t('notes'),
    'patient_dob': t('patientDob'),
    'treatment_date': t('treatmentDate'),
    'insurance_claim_number': t('insuranceClaimNumber'),
    'diagnosis_codes': t('diagnosisCodes'),
    'procedure_codes': t('procedureCodes'),
    'provider_id': t('providerId'),
    'line_items_summary': t('lineItems'),
  }

  return labelMap[key] || key
}

/**
 * Get translated template for CSV export
 */
export async function getTranslatedTemplate(templateId: string, locale: string = 'en'): Promise<ExportTemplate> {
  const baseTemplate = getTemplate(templateId) || STANDARD_TEMPLATE

  // Translate all column labels
  const translatedColumns = await Promise.all(
    baseTemplate.columns.map(async (col) => ({
      ...col,
      label: await getTranslatedLabel(col.key, locale),
    }))
  )

  return {
    ...baseTemplate,
    columns: translatedColumns,
  }
}

/**
 * Create custom translated template from selected columns
 */
export async function createTranslatedCustomTemplate(selectedColumns: string[], locale: string = 'en'): Promise<ExportTemplate> {
  const columns = await Promise.all(
    AVAILABLE_COLUMNS
      .filter(col => selectedColumns.includes(col.key))
      .map(async (col) => ({
        ...col,
        label: await getTranslatedLabel(col.key, locale),
      }))
  )

  return {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined columns',
    columns,
  }
}
