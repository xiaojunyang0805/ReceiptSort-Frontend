'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FileSpreadsheet, FileText, Download, ChevronDown, ChevronUp, Loader2, CalendarIcon, X } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import ExportDialog from '@/components/dashboard/ExportDialog'
import { cn } from '@/lib/utils'

interface Export {
  id: string
  export_type: 'csv' | 'excel'
  receipt_count: number
  file_name: string
  created_at: string
}

export default function ExportsPage() {
  const t = useTranslations('dashboard.exports')
  const tCommon = useTranslations('common')
  const [exports, setExports] = useState<Export[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Advanced filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [merchantSearch, setMerchantSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  useEffect(() => {
    fetchExports()
  }, [])

  const fetchExports = async () => {
    try {
      const supabase = createClient()

      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[Exports] User not authenticated')
        setIsLoading(false)
        return
      }

      console.log('[Exports] Fetching exports for user:', user.id)

      const { data, error } = await supabase
        .from('exports')
        .select('*')
        .order('created_at', { ascending: false})
        .limit(50)

      if (error) {
        console.error('[Exports] Failed to fetch exports:', error)
        console.error('[Exports] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return
      }

      console.log('[Exports] Fetched exports:', data?.length || 0)
      setExports(data || [])
    } catch (error) {
      console.error('[Exports] Error fetching exports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportWithFilters = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Build query with filters
      let query = supabase
        .from('receipts')
        .select('id')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')

      // Apply date filters
      if (dateFrom) {
        query = query.gte('receipt_date', dateFrom.toISOString())
      }
      if (dateTo) {
        query = query.lte('receipt_date', dateTo.toISOString())
      }

      // Apply merchant search filter
      if (merchantSearch.trim()) {
        query = query.ilike('merchant_name', `%${merchantSearch.trim()}%`)
      }

      // Apply amount filters
      if (minAmount) {
        query = query.gte('total_amount', parseFloat(minAmount))
      }
      if (maxAmount) {
        query = query.lte('total_amount', parseFloat(maxAmount))
      }

      const { data: receiptData, error } = await query

      if (error) throw error

      if (!receiptData || receiptData.length === 0) {
        toast.error('No receipts found', {
          description: 'No receipts match your filter criteria',
        })
        return
      }

      const receiptIds = receiptData.map(r => r.id)
      setSelectedIds(new Set(receiptIds))
      setExportDialogOpen(true)
    } catch (error) {
      console.error('[Export With Filters] Error:', error)
      toast.error('Export failed', {
        description: 'Failed to prepare export',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setMerchantSearch('')
    setMinAmount('')
    setMaxAmount('')
  }

  const hasActiveFilters = dateFrom || dateTo || merchantSearch || minAmount || maxAmount

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{tCommon('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6 pb-32 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Export Filters Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{t('exportSection.title')}</h2>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportWithFilters}
                disabled={isExporting}
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.loading')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('buttons.exportAll')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    {t('buttons.hide')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {t('buttons.filters')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range Filters */}
                <div className="space-y-2">
                  <Label>{t('filters.fromDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : t('filters.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t('filters.toDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : t('filters.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Merchant Search */}
                <div className="space-y-2">
                  <Label>{t('filters.merchantName')}</Label>
                  <Input
                    placeholder={t('filters.searchPlaceholder')}
                    value={merchantSearch}
                    onChange={(e) => setMerchantSearch(e.target.value)}
                  />
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label>{t('filters.amountRange')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('filters.min')}
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder={t('filters.max')}
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters and Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-col gap-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={isExporting}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('buttons.clearFilters')}
                  </Button>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <div className="font-medium mb-1">{t('filters.activeFilters')}:</div>
                  <div className="space-y-1">
                    {dateFrom && <div>• {t('filters.from')}: {format(dateFrom, "PPP")}</div>}
                    {dateTo && <div>• {t('filters.to')}: {format(dateTo, "PPP")}</div>}
                    {merchantSearch && <div>• {t('filters.merchant')}: &quot;{merchantSearch}&quot;</div>}
                    {minAmount && <div>• {t('filters.minAmount')}: ${minAmount}</div>}
                    {maxAmount && <div>• {t('filters.maxAmount')}: ${maxAmount}</div>}
                  </div>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Export History Section */}
      <div>
        <h2 className="text-2xl font-bold">{t('history.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('history.subtitle')}</p>
      </div>

      {exports.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Download className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-lg">{t('noExports')}</h3>
              <p className="text-muted-foreground mt-1">
                {t('noExportsDescription')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('fileName')}</TableHead>
                <TableHead>{t('columns.receipts')}</TableHead>
                <TableHead>{t('columns.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exportRecord) => (
                <TableRow key={exportRecord.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {exportRecord.export_type === 'excel' ? (
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                      <Badge
                        variant={exportRecord.export_type === 'excel' ? 'default' : 'secondary'}
                      >
                        {exportRecord.export_type.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {exportRecord.file_name}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {exportRecord.receipt_count} {t('receipts')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(exportRecord.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {exports.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {t('showingRecent', { count: exports.length })}
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={(open) => {
          setExportDialogOpen(open)
          if (!open) {
            setSelectedIds(new Set())
          }
        }}
        selectedIds={Array.from(selectedIds)}
        onExportComplete={() => {
          setSelectedIds(new Set())
          setExportDialogOpen(false)
          fetchExports() // Refresh export history
        }}
      />
    </div>
  )
}
