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
import { Loader2, Save, Trash2, FileText } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

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
  created_at: string
  updated_at: string
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
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
      })
    }
  }, [receipt])

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
              <div className="relative aspect-[3/4] w-full border rounded-lg overflow-hidden bg-muted">
                <Image
                  src={signedUrl}
                  alt={receipt.file_name}
                  fill
                  className="object-contain"
                />
              </div>
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
