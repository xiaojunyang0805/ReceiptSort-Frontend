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
import { FileSpreadsheet, FileText, Download, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatDistanceToNow, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns'
import { toast } from 'sonner'
import ExportDialog from '@/components/dashboard/ExportDialog'

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
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null)

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

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all completed receipts
      const { data: receiptData, error } = await supabase
        .from('receipts')
        .select('id')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')

      if (error) throw error

      if (!receiptData || receiptData.length === 0) {
        toast.error('No receipts found', {
          description: 'No completed receipts available to export',
        })
        return
      }

      const receiptIds = receiptData.map(r => r.id)
      setSelectedIds(new Set(receiptIds))
      setExportDialogOpen(true)
    } catch (error) {
      console.error('[Export All] Error:', error)
      toast.error('Export failed', {
        description: 'Failed to prepare export',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleTimePeriodExport = async (period: string) => {
    setIsExporting(true)
    setSelectedTimePeriod(period)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      let dateFrom: Date
      let dateTo = new Date()

      // Calculate date ranges
      switch (period) {
        case 'thisMonth':
          dateFrom = startOfMonth(now)
          dateTo = endOfMonth(now)
          break
        case 'lastMonth':
          dateFrom = startOfMonth(subMonths(now, 1))
          dateTo = endOfMonth(subMonths(now, 1))
          break
        case 'thisYear':
          dateFrom = startOfYear(now)
          dateTo = endOfYear(now)
          break
        case 'q1':
          dateFrom = startOfQuarter(new Date(now.getFullYear(), 0, 1))
          dateTo = endOfQuarter(new Date(now.getFullYear(), 0, 1))
          break
        case 'q2':
          dateFrom = startOfQuarter(new Date(now.getFullYear(), 3, 1))
          dateTo = endOfQuarter(new Date(now.getFullYear(), 3, 1))
          break
        case 'q3':
          dateFrom = startOfQuarter(new Date(now.getFullYear(), 6, 1))
          dateTo = endOfQuarter(new Date(now.getFullYear(), 6, 1))
          break
        case 'q4':
          dateFrom = startOfQuarter(new Date(now.getFullYear(), 9, 1))
          dateTo = endOfQuarter(new Date(now.getFullYear(), 9, 1))
          break
        default:
          dateFrom = new Date(0) // All time
      }

      // Fetch receipts with date filter
      let query = supabase
        .from('receipts')
        .select('id')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')

      if (period !== 'allTime') {
        query = query.gte('receipt_date', dateFrom.toISOString()).lte('receipt_date', dateTo.toISOString())
      }

      const { data: receiptData, error } = await query

      if (error) throw error

      if (!receiptData || receiptData.length === 0) {
        toast.error('No receipts found', {
          description: `No completed receipts found for ${period}`,
        })
        return
      }

      const receiptIds = receiptData.map(r => r.id)
      setSelectedIds(new Set(receiptIds))
      setExportDialogOpen(true)
    } catch (error) {
      console.error('[Time Period Export] Error:', error)
      toast.error('Export failed', {
        description: 'Failed to prepare export',
      })
    } finally {
      setIsExporting(false)
      setSelectedTimePeriod(null)
    }
  }

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
    <div className="container mx-auto py-8 space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Quick Export Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Quick Export</h2>
              <p className="text-sm text-muted-foreground">Export all your completed receipts or filter by time period</p>
            </div>
            <Button
              onClick={handleExportAll}
              disabled={isExporting}
              size="lg"
            >
              {isExporting && !selectedTimePeriod ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </>
              )}
            </Button>
          </div>

          {/* Collapsible Filters */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between"
            >
              <span>Filter by Time Period</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('thisMonth')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'thisMonth' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  This Month
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('lastMonth')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'lastMonth' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('thisYear')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'thisYear' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  This Year
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('q1')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'q1' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Q1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('q2')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'q2' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Q2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('q3')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'q3' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Q3
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('q4')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'q4' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Q4
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTimePeriodExport('allTime')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting && selectedTimePeriod === 'allTime' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  All Time
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Export History Title */}
      <div>
        <h2 className="text-2xl font-bold">Export History</h2>
        <p className="text-muted-foreground mt-1">View your past receipt exports</p>
      </div>

      {exports.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Download className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-lg">{t('noExports')}</h3>
              <p className="text-muted-foreground mt-1">
                Export receipts from the dashboard to see them here
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
                <TableHead>File Name</TableHead>
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
