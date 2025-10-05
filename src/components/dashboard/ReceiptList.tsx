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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  FileText,
  Loader2,
  CreditCard,
  Download,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import ExportDialog from './ExportDialog'
import ReceiptFilters, { ReceiptFiltersState, INITIAL_FILTERS } from './ReceiptFilters'
import ExportPresets from './ExportPresets'

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

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [userCredits, setUserCredits] = useState<number>(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [filters, setFilters] = useState<ReceiptFiltersState>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ReceiptFiltersState>(INITIAL_FILTERS)
  const [isExporting, setIsExporting] = useState(false)
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

  const handleProcessReceipt = async (receiptId: string) => {
    if (userCredits < 1) {
      toast.error('Insufficient credits', {
        description: 'You need at least 1 credit to process a receipt.',
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/credits',
        },
      })
      return
    }

    setProcessingIds(prev => new Set(prev).add(receiptId))

    try {
      const response = await fetch(`/api/receipts/${receiptId}/process`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process receipt')
      }

      toast.success('Receipt processed successfully!', {
        description: `Extracted: ${result.data.merchant_name} - $${result.data.amount}`,
      })

      // Update credits
      setUserCredits(result.credits_remaining)

      // Refetch receipts to update UI
      await fetchReceipts()
    } catch (error) {
      console.error('Error processing receipt:', error)
      toast.error('Failed to process receipt', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(receiptId)
        return newSet
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setReceipts(receipts.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting receipt:', error)
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
  const completedReceipts = filteredReceipts.filter(r => r.processing_status === 'completed')
  const allCompletedSelected = completedReceipts.length > 0 && completedReceipts.every(r => selectedIds.has(r.id))

  const handleSelectAll = () => {
    if (allCompletedSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(completedReceipts.map(r => r.id)))
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

  // Export preset handler
  const handlePresetExport = async (dateFrom: Date, dateTo: Date, label: string) => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch receipts with date filter
      let query = supabase
        .from('receipts')
        .select('id')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')

      if (dateFrom.getTime() !== 0) { // Not "All Time"
        query = query.gte('receipt_date', dateFrom.toISOString())
      }
      query = query.lte('receipt_date', dateTo.toISOString())

      const { data: receiptData, error } = await query

      if (error) throw error

      if (!receiptData || receiptData.length === 0) {
        toast.error('No receipts found', {
          description: `No completed receipts found for ${label}`,
        })
        return
      }

      const receiptIds = receiptData.map(r => r.id)

      // Use existing export dialog but with pre-selected IDs
      setSelectedIds(new Set(receiptIds))
      setExportDialogOpen(true)
    } catch (error) {
      console.error('[Preset Export] Error:', error)
      toast.error('Export failed', {
        description: 'Failed to prepare export',
      })
    } finally {
      setIsExporting(false)
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
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No receipts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your first receipt to get started
            </p>
          </div>
          <Button asChild>
            <a href="/upload">Upload Receipt</a>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Credit Warning */}
      {userCredits < 5 && userCredits >= 0 && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50 p-4">
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
        </Card>
      )}

      {/* Export Presets */}
      <ExportPresets onExport={handlePresetExport} isExporting={isExporting} />

      {/* Advanced Filters */}
      <ReceiptFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Search and Export Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Quick search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        {selectedCount > 0 && (
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="default"
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected ({selectedCount})
          </Button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allCompletedSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={completedReceipts.length === 0}
                />
              </TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(receipt.id)}
                    onCheckedChange={() => handleSelectReceipt(receipt.id)}
                    disabled={receipt.processing_status !== 'completed'}
                  />
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {receipt.file_name}
                </TableCell>
                <TableCell>{receipt.merchant_name || '-'}</TableCell>
                <TableCell>
                  {receipt.total_amount
                    ? `$${receipt.total_amount.toFixed(2)}`
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedReceipt(receipt)
                        setModalOpen(true)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {receipt.processing_status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => handleProcessReceipt(receipt.id)}
                          disabled={userCredits < 1 || processingIds.has(receipt.id)}
                        >
                          {processingIds.has(receipt.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Process (1 credit)
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {receipt.processing_status === 'completed' && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceipt(receipt)
                          setModalOpen(true)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Data
                        </DropdownMenuItem>
                      )}
                      {receipt.processing_status === 'failed' && (
                        <DropdownMenuItem
                          onClick={() => handleProcessReceipt(receipt.id)}
                          disabled={userCredits < 1 || processingIds.has(receipt.id)}
                        >
                          {processingIds.has(receipt.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Retry (1 credit)
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(receipt.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredReceipts.map((receipt) => (
          <Card key={receipt.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium truncate">{receipt.file_name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedReceipt(receipt)
                        setModalOpen(true)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {receipt.processing_status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => handleProcessReceipt(receipt.id)}
                          disabled={userCredits < 1 || processingIds.has(receipt.id)}
                        >
                          {processingIds.has(receipt.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Process (1 credit)
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {receipt.processing_status === 'completed' && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceipt(receipt)
                          setModalOpen(true)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Data
                        </DropdownMenuItem>
                      )}
                      {receipt.processing_status === 'failed' && (
                        <DropdownMenuItem
                          onClick={() => handleProcessReceipt(receipt.id)}
                          disabled={userCredits < 1 || processingIds.has(receipt.id)}
                        >
                          {processingIds.has(receipt.id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Retry (1 credit)
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(receipt.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {receipt.merchant_name && (
                    <p className="text-muted-foreground">
                      Merchant: {receipt.merchant_name}
                    </p>
                  )}
                  {receipt.total_amount && (
                    <p className="text-muted-foreground">
                      Amount: ${receipt.total_amount.toFixed(2)}
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
          </Card>
        ))}
      </div>

      {filteredReceipts.length === 0 && receipts.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No receipts match your search criteria
          </p>
        </Card>
      )}

      <ReceiptDetailModal
        receipt={selectedReceipt}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={fetchReceipts}
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
    </div>
  )
}
