'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, Trash2, FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Receipt {
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

  // Phase 3: Medical Receipts
  patient_dob?: string
  treatment_date?: string
  insurance_claim_number?: string
  diagnosis_codes?: string
  procedure_codes?: string
  provider_id?: string
}

interface LineItem {
  id?: string
  receipt_id?: string
  line_number: number
  description: string
  quantity: number
  unit_price: number
  line_total: number
  item_code?: string | null
  tax_rate?: number | null
}

interface ReceiptDetailModalProps {
  receipt: Receipt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Office Supplies',
  'Travel',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Other',
]

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
]

const CURRENCIES = ['USD', 'EUR', 'GBP']

const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'medical_invoice', label: 'Medical Invoice' },
  { value: 'bill', label: 'Bill' },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function ReceiptDetailModal({
  receipt,
  open,
  onOpenChange,
  onUpdate,
}: ReceiptDetailModalProps) {
  const [formData, setFormData] = useState<Partial<Receipt>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [lineItemsLoading, setLineItemsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (receipt) {
      setFormData({
        merchant_name: receipt.merchant_name || '',
        total_amount: receipt.total_amount || 0,
        currency: receipt.currency || 'USD',
        receipt_date: receipt.receipt_date || '',
        category: receipt.category || '',
        tax_amount: receipt.tax_amount || 0,
        payment_method: receipt.payment_method || '',
        notes: receipt.notes || '',

        // Phase 1: Essential Fields
        invoice_number: receipt.invoice_number || '',
        document_type: receipt.document_type || 'receipt',
        subtotal: receipt.subtotal || 0,
        vendor_address: receipt.vendor_address || '',
        due_date: receipt.due_date || '',

        // Phase 2: Business Invoices
        purchase_order_number: receipt.purchase_order_number || '',
        payment_reference: receipt.payment_reference || '',
        vendor_tax_id: receipt.vendor_tax_id || '',

        // Phase 3: Medical Receipts
        patient_dob: receipt.patient_dob || '',
        treatment_date: receipt.treatment_date || '',
        insurance_claim_number: receipt.insurance_claim_number || '',
        diagnosis_codes: receipt.diagnosis_codes || '',
        procedure_codes: receipt.procedure_codes || '',
        provider_id: receipt.provider_id || '',
      })

      // Fetch line items when receipt changes
      if (open) {
        fetchLineItems()
      }
    }
  }, [receipt, open])

  // Fetch line items for this receipt
  const fetchLineItems = async () => {
    if (!receipt) return

    setLineItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from('receipt_line_items')
        .select('*')
        .eq('receipt_id', receipt.id)
        .order('line_number', { ascending: true })

      if (error) throw error

      setLineItems(data || [])
    } catch (error) {
      console.error('Error fetching line items:', error)
      setLineItems([])
    } finally {
      setLineItemsLoading(false)
    }
  }

  // Fetch signed URL when modal opens
  useEffect(() => {
    if (receipt && open) {
      fetchSignedUrl()
    }
  }, [receipt?.id, open])

  const fetchSignedUrl = async () => {
    if (!receipt) return

    setUrlLoading(true)
    setUrlError(null)

    try {
      const response = await fetch(`/api/receipts/${receipt.id}/view`)

      if (!response.ok) {
        throw new Error('Failed to fetch signed URL')
      }

      const data = await response.json()
      setSignedUrl(data.signedUrl)

      // Auto-refresh URL 30 seconds before expiration (4.5 minutes)
      setTimeout(() => {
        if (open) {
          fetchSignedUrl()
        }
      }, 4.5 * 60 * 1000)
    } catch (error) {
      console.error('Error fetching signed URL:', error)
      setUrlError('Failed to load receipt preview')
    } finally {
      setUrlLoading(false)
    }
  }

  if (!receipt) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('receipts')
        .update({
          merchant_name: formData.merchant_name,
          total_amount: formData.total_amount,
          currency: formData.currency,
          receipt_date: formData.receipt_date,
          category: formData.category,
          tax_amount: formData.tax_amount,
          payment_method: formData.payment_method,
          notes: formData.notes,
          updated_at: new Date().toISOString(),

          // Phase 1: Essential Fields
          invoice_number: formData.invoice_number || null,
          document_type: formData.document_type,
          subtotal: formData.subtotal || null,
          vendor_address: formData.vendor_address || null,
          due_date: formData.due_date || null,

          // Phase 2: Business Invoices
          purchase_order_number: formData.purchase_order_number || null,
          payment_reference: formData.payment_reference || null,
          vendor_tax_id: formData.vendor_tax_id || null,

          // Phase 3: Medical Receipts
          patient_dob: formData.patient_dob || null,
          treatment_date: formData.treatment_date || null,
          insurance_claim_number: formData.insurance_claim_number || null,
          diagnosis_codes: formData.diagnosis_codes || null,
          procedure_codes: formData.procedure_codes || null,
          provider_id: formData.provider_id || null,
        })
        .eq('id', receipt.id)

      if (error) throw error

      toast.success('Receipt updated successfully')
      onUpdate?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating receipt:', error)
      toast.error('Failed to update receipt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receipt.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receipt.id)

      if (dbError) throw dbError

      toast.success('Receipt deleted successfully')
      onUpdate?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting receipt:', error)
      toast.error('Failed to delete receipt')
    } finally {
      setDeleting(false)
    }
  }

  const handleRetry = async () => {
    if (!receipt) return

    setRetrying(true)
    try {
      const response = await fetch(`/api/receipts/${receipt.id}/retry`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry processing')
      }

      toast.success('Receipt processed successfully')
      onUpdate?.()
    } catch (error) {
      console.error('Error retrying receipt:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to retry processing')
    } finally {
      setRetrying(false)
    }
  }

  const isEditable = receipt.processing_status === 'completed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Receipt Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {receipt.file_name}
              </p>
            </div>
            <Badge className={statusConfig[receipt.processing_status].color}>
              {statusConfig[receipt.processing_status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Left: Image Preview */}
          <div className="space-y-4">
            <Label>Receipt Preview</Label>
            {urlLoading ? (
              <div className="aspect-[3/4] w-full border rounded-lg flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : urlError ? (
              <div className="aspect-[3/4] w-full border rounded-lg flex flex-col items-center justify-center bg-muted p-4">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">{urlError}</p>
                <Button onClick={fetchSignedUrl} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            ) : signedUrl && receipt.file_type.startsWith('image/') ? (
              imageError ? (
                <div className="aspect-[3/4] w-full border rounded-lg flex flex-col items-center justify-center bg-muted p-4">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Failed to load image</p>
                  <p className="text-xs text-muted-foreground mb-4">Using direct link instead</p>
                  <Button asChild variant="outline" size="sm">
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                      Open Image
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={signedUrl}
                    alt={receipt.file_name}
                    fill
                    className="object-contain"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                </div>
              )
            ) : signedUrl ? (
              <div className="aspect-[3/4] w-full border rounded-lg flex flex-col items-center justify-center bg-muted">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">PDF Document</p>
                <Button asChild variant="outline">
                  <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                    Open PDF
                  </a>
                </Button>
              </div>
            ) : null}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Size: {(receipt.file_size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Uploaded: {format(new Date(receipt.created_at), 'PPp')}</p>
              {receipt.confidence_score && (
                <p>Confidence: {(receipt.confidence_score * 100).toFixed(0)}%</p>
              )}
            </div>
          </div>

          {/* Right: Editable Form */}
          <div className="space-y-4">
            {/* Error Alert */}
            {receipt.processing_status === 'failed' && receipt.processing_error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Processing Failed</div>
                  <div className="text-sm">{receipt.processing_error}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="mt-3"
                  >
                    {retrying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Processing
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Low Confidence Warning */}
            {receipt.processing_status === 'completed' &&
              receipt.confidence_score !== undefined &&
              receipt.confidence_score < 0.7 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Low Confidence Detection</div>
                    <div className="text-sm">
                      The AI had low confidence ({(receipt.confidence_score * 100).toFixed(0)}%)
                      in the extracted data. Please verify all fields carefully.
                    </div>
                    {receipt.processing_error && (
                      <div className="text-sm mt-2 text-muted-foreground">
                        Warnings: {receipt.processing_error}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

            {/* Phase 1: Document Type Selector */}
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, document_type: value })
                }
                disabled={!isEditable}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="merchant">Merchant Name</Label>
              <Input
                id="merchant"
                value={formData.merchant_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, merchant_name: e.target.value })
                }
                disabled={!isEditable}
                placeholder="Enter merchant name"
              />
            </div>

            {/* Phase 1: Invoice Number (for invoices and bills) */}
            {(formData.document_type === 'invoice' ||
              formData.document_type === 'medical_invoice' ||
              formData.document_type === 'bill') && (
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoice_number || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_number: e.target.value })
                  }
                  disabled={!isEditable}
                  placeholder="INV-2025-001"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isEditable}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                  disabled={!isEditable}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="date">Receipt Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.receipt_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, receipt_date: e.target.value })
                }
                disabled={!isEditable}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                disabled={!isEditable}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phase 1: Subtotal and Tax (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtotal">Subtotal (Before Tax)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isEditable}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="tax">Tax Amount</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={formData.tax_amount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })
                  }
                  disabled={!isEditable}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Phase 1: Due Date (for invoices and bills) */}
            {(formData.document_type === 'invoice' ||
              formData.document_type === 'medical_invoice' ||
              formData.document_type === 'bill') && (
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  disabled={!isEditable}
                />
              </div>
            )}

            <div>
              <Label htmlFor="payment">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
                disabled={!isEditable}
              >
                <SelectTrigger id="payment">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phase 2: Business Invoice Fields (for invoices) */}
            {(formData.document_type === 'invoice' ||
              formData.document_type === 'medical_invoice' ||
              formData.document_type === 'bill') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseOrderNumber">Purchase Order #</Label>
                    <Input
                      id="purchaseOrderNumber"
                      value={formData.purchase_order_number || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, purchase_order_number: e.target.value })
                      }
                      disabled={!isEditable}
                      placeholder="PO-2025-456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentReference">Payment Reference</Label>
                    <Input
                      id="paymentReference"
                      value={formData.payment_reference || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_reference: e.target.value })
                      }
                      disabled={!isEditable}
                      placeholder="TXN-789012"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vendorTaxId">Vendor Tax ID (VAT/EIN/BTW)</Label>
                  <Input
                    id="vendorTaxId"
                    value={formData.vendor_tax_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_tax_id: e.target.value })
                    }
                    disabled={!isEditable}
                    placeholder="VAT123456789"
                  />
                </div>
              </>
            )}

            {/* Phase 1: Vendor Address (for invoices) */}
            {(formData.document_type === 'invoice' ||
              formData.document_type === 'medical_invoice' ||
              formData.document_type === 'bill') && (
              <div>
                <Label htmlFor="vendorAddress">Vendor Address</Label>
                <Textarea
                  id="vendorAddress"
                  value={formData.vendor_address || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_address: e.target.value })
                  }
                  disabled={!isEditable}
                  placeholder="123 Main Street, City, State 12345"
                  rows={2}
                />
              </div>
            )}

            {/* Phase 2: Line Items Table */}
            {lineItems.length > 0 && (
              <div className="space-y-2">
                <Label>Line Items ({lineItems.length})</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">Description</th>
                          <th className="px-3 py-2 text-right font-medium">Qty</th>
                          <th className="px-3 py-2 text-right font-medium">Price</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lineItems.map((item) => (
                          <tr key={item.id || item.line_number} className="hover:bg-muted/50">
                            <td className="px-3 py-2 text-muted-foreground">{item.line_number}</td>
                            <td className="px-3 py-2">
                              <div>{item.description}</div>
                              {item.item_code && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Code: {item.item_code}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              {formData.currency} {item.unit_price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formData.currency} {item.line_total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {lineItemsLoading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading line items...
                  </div>
                )}
              </div>
            )}

            {/* Phase 3: Medical Invoice Fields (for medical_invoice only) */}
            {formData.document_type === 'medical_invoice' && (
              <>
                <div className="space-y-2 pt-2">
                  <Label className="text-base font-semibold">Medical Information</Label>
                  <div className="border-t pt-3 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientDob">Patient Date of Birth</Label>
                        <Input
                          id="patientDob"
                          type="date"
                          value={formData.patient_dob || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, patient_dob: e.target.value })
                          }
                          disabled={!isEditable}
                        />
                      </div>
                      <div>
                        <Label htmlFor="treatmentDate">Treatment Date</Label>
                        <Input
                          id="treatmentDate"
                          type="date"
                          value={formData.treatment_date || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, treatment_date: e.target.value })
                          }
                          disabled={!isEditable}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="insuranceClaim">Insurance Claim Number</Label>
                      <Input
                        id="insuranceClaim"
                        value={formData.insurance_claim_number || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, insurance_claim_number: e.target.value })
                        }
                        disabled={!isEditable}
                        placeholder="CLAIM-2025-789"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="diagnosisCodes">Diagnosis Codes (ICD)</Label>
                        <Input
                          id="diagnosisCodes"
                          value={formData.diagnosis_codes || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, diagnosis_codes: e.target.value })
                          }
                          disabled={!isEditable}
                          placeholder="M54.5, Z79.899"
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedureCodes">Procedure Codes (CPT)</Label>
                        <Input
                          id="procedureCodes"
                          value={formData.procedure_codes || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, procedure_codes: e.target.value })
                          }
                          disabled={!isEditable}
                          placeholder="F517A, 99213"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="providerId">Provider ID (AGB/NPI)</Label>
                      <Input
                        id="providerId"
                        value={formData.provider_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, provider_id: e.target.value })
                        }
                        disabled={!isEditable}
                        placeholder="12065201 (AGB) or 1234567890 (NPI)"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={!isEditable}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {!isEditable && (
              <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                This receipt must be processed before you can edit the data.
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!isEditable || saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
