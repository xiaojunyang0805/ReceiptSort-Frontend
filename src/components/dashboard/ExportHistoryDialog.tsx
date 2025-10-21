'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, FileText, Download, Loader2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { toast } from 'sonner'

interface Export {
  id: string
  export_type: 'csv' | 'excel'
  receipt_count: number
  file_name: string
  file_path: string | null
  file_url: string | null
  created_at: string
}

interface ExportHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ExportHistoryDialog({
  open,
  onOpenChange,
}: ExportHistoryDialogProps) {
  const t = useTranslations('dashboard.exports')
  const [exports, setExports] = useState<Export[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchExports()
    }
  }, [open])

  const fetchExports = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('[Export History] Failed to fetch:', error)
        toast.error('Failed to load export history')
        return
      }

      setExports(data || [])
    } catch (error) {
      console.error('[Export History] Error:', error)
      toast.error('Failed to load export history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (exportRecord: Export) => {
    if (!exportRecord.file_url) {
      toast.error('Download link not available', {
        description: 'This export file is no longer available',
      })
      return
    }

    setDownloadingId(exportRecord.id)
    try {
      // Download the file
      const response = await fetch(exportRecord.file_url)
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportRecord.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download started')
    } catch (error) {
      console.error('[Export History] Download error:', error)
      toast.error('Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const getDaysRemaining = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const daysPassed = differenceInDays(now, created)
    return Math.max(0, 30 - daysPassed)
  }

  const isExpired = (createdAt: string) => {
    return getDaysRemaining(createdAt) === 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t('history.title')}</DialogTitle>
          <DialogDescription>
            {t('history.subtitle')}
            <br />
            <span className="text-xs text-muted-foreground mt-1 inline-block">
              {t('history.autoDelete')}
            </span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : exports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Download className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">{t('noExports')}</h3>
            <p className="text-muted-foreground mt-1">
              {t('noExportsDescription')}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('fileName')}</TableHead>
                  <TableHead>{t('columns.receipts')}</TableHead>
                  <TableHead>{t('columns.date')}</TableHead>
                  <TableHead className="text-center">{t('columns.expires')}</TableHead>
                  <TableHead className="text-right">{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportRecord) => {
                  const daysRemaining = getDaysRemaining(exportRecord.created_at)
                  const expired = isExpired(exportRecord.created_at)

                  return (
                    <TableRow key={exportRecord.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {exportRecord.export_type === 'excel' ? (
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-600" />
                          )}
                          <Badge
                            variant={
                              exportRecord.export_type === 'excel' ? 'default' : 'secondary'
                            }
                          >
                            {exportRecord.export_type.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
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
                      <TableCell className="text-center">
                        {expired ? (
                          <Badge variant="destructive" className="text-xs">
                            {t('status.expired')}
                          </Badge>
                        ) : daysRemaining <= 7 ? (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                            {daysRemaining}{t('status.daysShort')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {daysRemaining}{t('status.daysShort')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {expired || !exportRecord.file_url ? (
                          <Button variant="ghost" size="sm" disabled>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {t('actions.unavailable')}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(exportRecord)}
                            disabled={downloadingId === exportRecord.id}
                          >
                            {downloadingId === exportRecord.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                {t('actions.downloading')}
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                {t('actions.download')}
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {exports.length > 0 && (
          <div className="text-sm text-muted-foreground text-center pt-2">
            {t('showingRecent', { count: exports.length })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
