'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReceiptDetailModal from './ReceiptDetailModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye,
  Trash2,
  FileText,
  Loader2,
  CreditCard,
  Download,
  History,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Link } from '@/lib/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import ExportDialog from './ExportDialog'
import ExportHistoryDialog from './ExportHistoryDialog'
import ReceiptFilters, { ReceiptFiltersState, INITIAL_FILTERS } from './ReceiptFilters'
import { useTranslations } from 'next-intl'

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
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CNY: '¥',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'AU$',
}

// Format amount with correct currency symbol
function formatAmount(amount: number, currency?: string): string {
  const currencyCode = currency || 'USD'
  const symbol = currencySymbols[currencyCode] || currencyCode
  return `${symbol}${amount.toFixed(2)}`
}

export default function ReceiptList() {
  const t = useTranslations('dashboard.receiptsPage')
  const tTable = useTranslations('dashboard.receiptsTable')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false)
  const [filters, setFilters] = useState<ReceiptFiltersState>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ReceiptFiltersState>(INITIAL_FILTERS)
  const [retrying, setRetrying] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchReceipts()
    fetchUserCredits()

    // Set up real-time subscription
    const channel = supabase
      .channel('receipts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
        },
        (payload) => {
          console.log('Receipt change detected:', payload)
          fetchReceipts() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters])

  const fetchReceipts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (appliedFilters.dateFrom) {
        query = query.gte('receipt_date', appliedFilters.dateFrom.toISOString())
      }
      if (appliedFilters.dateTo) {
        query = query.lte('receipt_date', appliedFilters.dateTo.toISOString())
      }
      if (appliedFilters.categories.length > 0) {
        query = query.in('category', appliedFilters.categories)
      }
      if (appliedFilters.statuses.length > 0) {
        query = query.in('processing_status', appliedFilters.statuses)
      }
      if (appliedFilters.amountMin) {
        query = query.gte('total_amount', parseFloat(appliedFilters.amountMin))
      }
      if (appliedFilters.amountMax) {
        query = query.lte('total_amount', parseFloat(appliedFilters.amountMax))
      }
      if (appliedFilters.searchQuery) {
        query = query.or(`merchant_name.ilike.%${appliedFilters.searchQuery}%,file_name.ilike.%${appliedFilters.searchQuery}%`)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setReceipts(data || [])
    } catch (error) {
      console.error('Error fetching receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserCredits(data?.credits ?? 0)
    } catch (error) {
      console.error('Error fetching user credits:', error)
    }
  }

  // Filter receipts based on search and status
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || receipt.processing_status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Checkbox handlers
  // Allow selection of completed, pending, and failed receipts (not processing)
  const selectableReceipts = filteredReceipts.filter(r => r.processing_status !== 'processing')
  const allSelectableSelected = selectableReceipts.length > 0 && selectableReceipts.every(r => selectedIds.has(r.id))

  const handleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectableReceipts.map(r => r.id)))
    }
  }

  const handleSelectReceipt = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectedCount = selectedIds.size

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setLoading(true)
  }

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS)
    setAppliedFilters(INITIAL_FILTERS)
    setLoading(true)
  }

  // Retry handler for pending/failed receipts
  const handleRetrySelected = async () => {
    if (selectedCount === 0) return

    setRetrying(true)
    try {
      const selectedReceipts = filteredReceipts.filter(r => selectedIds.has(r.id))
      const retryableReceipts = selectedReceipts.filter(
        r => r.processing_status === 'pending' || r.processing_status === 'failed'
      )

      if (retryableReceipts.length === 0) {
        toast.error('No pending or failed receipts selected')
        return
      }

      // Retry each receipt
      const results = await Promise.allSettled(
        retryableReceipts.map(receipt =>
          fetch(`/api/receipts/${receipt.id}/retry`, { method: 'POST' })
            .then(res => res.json())
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`Processing started for ${successful} receipt${successful === 1 ? '' : 's'}`)
      }
      if (failed > 0) {
        toast.error(`Failed to process ${failed} receipt${failed === 1 ? '' : 's'}`)
      }

      // Clear selection and refresh
      setSelectedIds(new Set())
      fetchReceipts()
    } catch (error) {
      console.error('Error retrying receipts:', error)
      toast.error('Failed to process receipts')
    } finally {
      setRetrying(false)
    }
  }


  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <Card className="w-full max-w-full">
        <CardContent className="text-center py-12 w-full max-w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('noReceipts')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('noReceiptsDescription')}
              </p>
            </div>
            <Button asChild>
              <a href="/upload">{t('uploadButton')}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Credit Warning */}
      {userCredits < 5 && userCredits >= 0 && (
        <Card className="w-full max-w-full bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    {userCredits === 0 ? 'Out of credits!' : 'Low on credits'}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {userCredits === 0
                      ? 'Purchase credits to process receipts'
                      : `You have ${userCredits} credit${userCredits === 1 ? '' : 's'} remaining`}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="border-yellow-600 text-yellow-600 hover:bg-yellow-100">
                <Link href="/credits">Buy Credits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View and Export Actions Bar */}
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="w-full max-w-full">
          <CardTitle>{t('viewAndExport')}</CardTitle>
          <CardDescription>
            {selectedCount > 0
              ? t('receiptsSelected', { count: selectedCount })
              : t('selectReceipts')}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full max-w-full">
          <div className="flex flex-col gap-2 w-full max-w-full">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                disabled={selectedCount === 0}
                onClick={() => {
                  const firstSelectedReceipt = filteredReceipts.find(r => selectedIds.has(r.id))
                  if (firstSelectedReceipt) {
                    setSelectedReceipt(firstSelectedReceipt)
                    setModalOpen(true)
                  }
                }}
                className="w-full text-xs sm:text-sm py-2"
              >
                <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {selectedCount > 0 ? t('viewDetailsCount', { count: selectedCount }) : t('viewDetails')}
              </Button>
              <Button
                variant="outline"
                disabled={selectedCount === 0 || retrying}
                onClick={handleRetrySelected}
                className="w-full text-xs sm:text-sm py-2"
              >
                {retrying ? (
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                )}
                Process
              </Button>
              <Button
                variant="outline"
                disabled={selectedCount === 0}
                onClick={() => setExportDialogOpen(true)}
                className="w-full text-xs sm:text-sm py-2"
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {selectedCount > 0 ? t('exportCount', { count: selectedCount }) : t('exportButton')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setExportHistoryOpen(true)}
                className="w-full text-xs sm:text-sm py-2"
              >
                <History className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t('exportHistory')}
              </Button>
            </div>

            {/* Destructive Action - Separated */}
            <Button
              variant="outline"
              disabled={selectedCount === 0}
              onClick={async () => {
                if (!confirm(t('deleteConfirm', { count: selectedCount }))) return

                try {
                  const { error } = await supabase
                    .from('receipts')
                    .delete()
                    .in('id', Array.from(selectedIds))

                  if (error) throw error

                  toast.success(t('deleteSuccess', { count: selectedCount }))
                  setSelectedIds(new Set())
                  fetchReceipts()
                } catch (error) {
                  console.error('Error deleting receipts:', error)
                  toast.error(t('deleteFailed'))
                }
              }}
              className="w-full text-xs sm:text-sm py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {selectedCount > 0 ? t('deleteCount', { count: selectedCount }) : t('deleteButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <ReceiptFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder={t('quickSearch')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="completed">{tTable('status.completed')}</option>
          <option value="failed">{tTable('status.failed')}</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg w-full max-w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelectableSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={selectableReceipts.length === 0}
                />
              </TableHead>
              <TableHead>{tTable('columns.fileName')}</TableHead>
              <TableHead>{tTable('columns.merchant')}</TableHead>
              <TableHead>{tTable('columns.amount')}</TableHead>
              <TableHead>{tTable('columns.date')}</TableHead>
              <TableHead>{tTable('columns.category')}</TableHead>
              <TableHead>{tTable('columns.status')}</TableHead>
              <TableHead>{tTable('columns.uploaded')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(receipt.id)}
                    onCheckedChange={() => handleSelectReceipt(receipt.id)}
                    disabled={receipt.processing_status === 'processing'}
                  />
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {receipt.file_name}
                </TableCell>
                <TableCell>{receipt.merchant_name || '-'}</TableCell>
                <TableCell>
                  {receipt.total_amount
                    ? formatAmount(receipt.total_amount, receipt.currency)
                    : '-'}
                </TableCell>
                <TableCell>
                  {receipt.receipt_date
                    ? new Date(receipt.receipt_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>{receipt.category || '-'}</TableCell>
                <TableCell>
                  <Badge className={statusConfig[receipt.processing_status].color}>
                    {receipt.processing_status === 'processing' && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {statusConfig[receipt.processing_status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(receipt.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 w-full max-w-full">
        {filteredReceipts.map((receipt) => (
          <Card key={receipt.id} className="w-full max-w-full overflow-hidden">
            <CardContent className="pt-6 w-full max-w-full">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedIds.has(receipt.id)}
                  onCheckedChange={() => handleSelectReceipt(receipt.id)}
                  disabled={receipt.processing_status === 'processing'}
                  className="flex-shrink-0 mt-1"
                />
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{receipt.file_name}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {receipt.merchant_name && (
                      <p className="text-muted-foreground">
                        Merchant: {receipt.merchant_name}
                      </p>
                    )}
                    {receipt.total_amount && (
                      <p className="text-muted-foreground">
                        Amount: {formatAmount(receipt.total_amount, receipt.currency)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={statusConfig[receipt.processing_status].color}>
                        {receipt.processing_status === 'processing' && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {statusConfig[receipt.processing_status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(receipt.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReceipts.length === 0 && receipts.length > 0 && (
        <Card className="w-full max-w-full">
          <CardContent className="text-center py-8 w-full max-w-full">
            <p className="text-muted-foreground">
              {t('noMatchingReceipts')}
            </p>
          </CardContent>
        </Card>
      )}

      <ReceiptDetailModal
        receipt={selectedReceipt}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={fetchReceipts}
        onNavigate={setSelectedReceipt}
        allReceipts={filteredReceipts}
        selectedReceipts={filteredReceipts.filter(r => selectedIds.has(r.id))}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        selectedIds={Array.from(selectedIds)}
        onExportComplete={() => {
          setSelectedIds(new Set())
          setExportDialogOpen(false)
        }}
      />

      <ExportHistoryDialog
        open={exportHistoryOpen}
        onOpenChange={setExportHistoryOpen}
      />
    </div>
  )
}
