'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { FileSpreadsheet, FileText, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Export {
  id: string
  export_type: 'csv' | 'excel'
  receipt_count: number
  file_name: string
  created_at: string
}

export default function ExportsPage() {
  const [exports, setExports] = useState<Export[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        .order('created_at', { ascending: false })
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading exports...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export History</h1>
        <p className="text-muted-foreground mt-2">
          View your past receipt exports
        </p>
      </div>

      {exports.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Download className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-medium text-lg">No exports yet</h3>
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
                <TableHead>Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Receipts</TableHead>
                <TableHead>Created</TableHead>
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
                      {exportRecord.receipt_count} receipt{exportRecord.receipt_count === 1 ? '' : 's'}
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
          Showing {exports.length} most recent export{exports.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )
}
