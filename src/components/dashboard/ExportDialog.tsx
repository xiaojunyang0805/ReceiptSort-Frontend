'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileSpreadsheet, FileText, Loader2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  EXPORT_TEMPLATES,
  AVAILABLE_COLUMNS,
  saveTemplatePreference,
  loadTemplatePreference,
} from '@/lib/export-templates'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onExportComplete: () => void
}

type ExportFormat = 'csv' | 'excel'

const MAX_EXPORT_RECEIPTS = 1000
const LARGE_EXPORT_WARNING = 50

export default function ExportDialog({
  open,
  onOpenChange,
  selectedIds,
  onExportComplete,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [customColumns, setCustomColumns] = useState<string[]>([
    'merchant_name',
    'total_amount',
    'receipt_date',
  ])
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Load saved template preference
  useEffect(() => {
    const preference = loadTemplatePreference()
    if (preference) {
      setSelectedTemplate(preference.templateId)
      if (preference.customColumns.length > 0) {
        setCustomColumns(preference.customColumns)
      }
    }
  }, [])

  const handleExport = async () => {
    if (selectedIds.length === 0) return

    setIsExporting(true)

    // Save template preference
    saveTemplatePreference(selectedTemplate, customColumns)

    try {
      const endpoint = selectedFormat === 'csv' ? '/api/export/csv' : '/api/export/excel'

      const requestBody: {
        receipt_ids: string[]
        template_id?: string
        custom_columns?: string[]
      } = {
        receipt_ids: selectedIds,
      }

      // Add template info for CSV exports
      if (selectedFormat === 'csv') {
        requestBody.template_id = selectedTemplate
        if (selectedTemplate === 'custom') {
          requestBody.custom_columns = customColumns
        }
      }

      console.log('[Export Dialog] Starting export:', {
        format: selectedFormat,
        receiptCount: selectedIds.length,
        endpoint
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[Export Dialog] Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('[Export Dialog] Export failed:', error)
        throw new Error(error.error || 'Export failed')
      }

      console.log('[Export Dialog] Export succeeded, downloading file...')

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `receipts-${new Date().toISOString().split('T')[0]}.${selectedFormat === 'csv' ? 'csv' : 'xlsx'}`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export successful',
        description: `${selectedIds.length} receipt${selectedIds.length === 1 ? '' : 's'} exported to ${selectedFormat.toUpperCase()}`,
      })

      onExportComplete()
    } catch (error) {
      console.error('[Export] Error:', error)
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export receipts',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Receipts</DialogTitle>
          <DialogDescription>
            Export {selectedIds.length} selected receipt{selectedIds.length === 1 ? '' : 's'} to your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm font-medium mb-2">Select Format</div>
          <div className="grid grid-cols-2 gap-4">
            {/* Excel Option */}
            <button
              onClick={() => setSelectedFormat('excel')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'excel'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              disabled={isExporting}
            >
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet
                  className={`h-8 w-8 ${
                    selectedFormat === 'excel'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
                <div className="text-sm font-medium">Excel</div>
                <div className="text-xs text-muted-foreground text-center">
                  Formatted with totals & charts
                </div>
              </div>
            </button>

            {/* CSV Option */}
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              disabled={isExporting}
            >
              <div className="flex flex-col items-center gap-2">
                <FileText
                  className={`h-8 w-8 ${
                    selectedFormat === 'csv'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
                <div className="text-sm font-medium">CSV</div>
                <div className="text-xs text-muted-foreground text-center">
                  Plain text for import
                </div>
              </div>
            </button>
          </div>

          {/* Template Selection (CSV only) */}
          {selectedFormat === 'csv' && (
            <div className="space-y-2">
              <Label>Export Template</Label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isExporting}
              >
                {EXPORT_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
                <option value="custom">Custom - Choose columns</option>
              </select>
            </div>
          )}

          {/* Custom Column Selection */}
          {selectedFormat === 'csv' && selectedTemplate === 'custom' && (
            <div className="space-y-2">
              <Label>Select Columns</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                {AVAILABLE_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${column.key}`}
                      checked={customColumns.includes(column.key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCustomColumns([...customColumns, column.key])
                        } else if (!column.required) {
                          setCustomColumns(customColumns.filter(k => k !== column.key))
                        }
                      }}
                      disabled={column.required || isExporting}
                    />
                    <label
                      htmlFor={`col-${column.key}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                * Required fields cannot be deselected
              </p>
            </div>
          )}

          {/* Warnings */}
          {selectedIds.length > MAX_EXPORT_RECEIPTS && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3">
              <div className="text-sm font-medium text-red-900 dark:text-red-100">
                ⚠️ Export Limit Exceeded
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                You&apos;ve selected {selectedIds.length} receipts. Maximum is {MAX_EXPORT_RECEIPTS}.
                Please use filters to reduce the selection.
              </div>
            </div>
          )}

          {selectedIds.length > LARGE_EXPORT_WARNING && selectedIds.length <= MAX_EXPORT_RECEIPTS && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-3">
              <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Large Export
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                This is a large export ({selectedIds.length} receipts). It may take a few seconds to generate.
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="text-sm font-medium">Export Preview</div>
            <div className="text-xs text-muted-foreground">
              • {selectedIds.length} receipt{selectedIds.length === 1 ? '' : 's'} will be exported
            </div>
            <div className="text-xs text-muted-foreground">
              • Only completed receipts are included
            </div>
            <div className="text-xs text-muted-foreground">
              • {selectedFormat === 'excel' ? 'Excel file with formatting and summary sheet' : 'CSV file ready for import'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedIds.length === 0 || selectedIds.length > MAX_EXPORT_RECEIPTS}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
