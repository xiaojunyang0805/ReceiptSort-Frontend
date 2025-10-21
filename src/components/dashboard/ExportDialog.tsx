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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileSpreadsheet, FileText, Loader2, Download, Sparkles, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  EXPORT_TEMPLATES,
  AVAILABLE_COLUMNS,
  saveTemplatePreference,
  loadTemplatePreference,
} from '@/lib/export-templates'
import { useLocale } from 'next-intl'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  onExportComplete: () => void
}

type ExportFormat = 'csv' | 'excel' | 'template' | 'smart-template'

interface CustomTemplate {
  id: string
  template_name: string
  description: string | null
  export_count: number
}

interface AIAnalysis {
  sheetName: string
  startRow: number
  fieldMapping: Record<string, string>
  suggestedMappings: Record<string, { column: string; confidence: number; reason: string }>
  aiAnalysis: string
  headers: string[]
}

const MAX_EXPORT_RECEIPTS = 1000
const LARGE_EXPORT_WARNING = 50

export default function ExportDialog({
  open,
  onOpenChange,
  selectedIds,
  onExportComplete,
}: ExportDialogProps) {
  const locale = useLocale()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [customColumns, setCustomColumns] = useState<string[]>([
    'merchant_name',
    'total_amount',
    'receipt_date',
  ])
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const [uploadedTemplate, setUploadedTemplate] = useState<File | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [saveForReuse, setSaveForReuse] = useState(false)
  const [templateNameForSave, setTemplateNameForSave] = useState('')
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

  // Fetch custom templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomTemplates()
    }
  }, [open])

  const fetchCustomTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (response.ok && data.templates) {
        setCustomTemplates(data.templates)
        if (data.templates.length > 0 && !selectedCustomTemplate) {
          setSelectedCustomTemplate(data.templates[0].id)
        }
      }
    } catch (error) {
      console.error('[Export Dialog] Failed to fetch custom templates:', error)
    }
  }

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    setUploadedTemplate(file)
    setIsAnalyzing(true)

    try {
      // Call AI analysis API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/templates/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze template')
      }

      setAiAnalysis(data.analysis)
      setSelectedFormat('smart-template')

      toast({
        title: 'Template analyzed!',
        description: `AI detected ${Object.keys(data.analysis.fieldMapping).length} field mappings. Review and export.`,
      })
    } catch (error) {
      console.error('[Export Dialog] Template analysis failed:', error)
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to analyze template',
        variant: 'destructive',
      })
      setUploadedTemplate(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = async (overrideFormat?: ExportFormat) => {
    if (selectedIds.length === 0) return

    setIsExporting(true)

    const exportFormat = overrideFormat || selectedFormat

    // Save template preference
    saveTemplatePreference(selectedTemplate, customColumns)

    try {
      let endpoint = '/api/export/excel'
      let requestBody: Record<string, unknown> = {
        receipt_ids: selectedIds,
      }

      console.log('[Export Dialog] handleExport called with format:', exportFormat)

      // Determine endpoint based on format
      if (exportFormat === 'csv') {
        endpoint = '/api/export/csv'
        requestBody.locale = locale
        requestBody.template_id = selectedTemplate
        if (selectedTemplate === 'custom') {
          requestBody.custom_columns = customColumns
        }
      } else if (exportFormat === 'template') {
        endpoint = '/api/export/template'
        requestBody.template_id = selectedCustomTemplate
      } else if (exportFormat === 'smart-template') {
        // Smart template with AI analysis
        if (!uploadedTemplate || !aiAnalysis) {
          toast({
            title: 'Template required',
            description: 'Please upload and analyze a template first',
            variant: 'destructive',
          })
          setIsExporting(false)
          return
        }

        endpoint = '/api/export/smart-template'

        console.log('[Export Dialog] Processing smart template:', {
          fileName: uploadedTemplate.name,
          fileSize: uploadedTemplate.size,
          sheetName: aiAnalysis.sheetName,
          startRow: aiAnalysis.startRow,
          fieldCount: Object.keys(aiAnalysis.fieldMapping).length,
          receiptCount: selectedIds.length,
        })

        // Convert file to base64
        const arrayBuffer = await uploadedTemplate.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')

        console.log('[Export Dialog] Base64 conversion complete, length:', base64.length)

        requestBody = {
          receipt_ids: selectedIds,
          template_file: base64,
          sheet_name: aiAnalysis.sheetName,
          start_row: aiAnalysis.startRow,
          field_mapping: aiAnalysis.fieldMapping,
          save_for_reuse: saveForReuse,
          template_name: saveForReuse ? templateNameForSave : undefined,
        }
      } else if (exportFormat === 'excel') {
        requestBody.locale = locale
      }

      console.log('[Export Dialog] Starting export:', {
        format: exportFormat,
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

      console.log('[Export Dialog] Response status:', response.status, 'Content-Type:', response.headers.get('Content-Type'))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Export Dialog] Export failed. Status:', response.status, 'Response:', errorText)

        let errorMessage = 'Export failed'
        let errorDescription = ''

        try {
          const error = JSON.parse(errorText)
          errorMessage = error.error || error.details || 'Export failed'

          // Add specific error descriptions
          if (errorMessage.includes('No completed receipts')) {
            errorDescription = 'Selected receipts are still being processed. Please wait for processing to complete.'
          } else if (errorMessage.includes('Insufficient credits')) {
            errorDescription = 'You need more credits to perform this export. Please purchase credits.'
          }
        } catch {
          errorMessage = errorText || 'Export failed'
        }

        toast({
          title: errorMessage,
          description: errorDescription || 'Please try again or contact support',
          variant: 'destructive',
        })

        throw new Error(errorMessage)
      }

      console.log('[Export Dialog] Export succeeded, downloading file...')

      // Download the file
      const blob = await response.blob()
      console.log('[Export Dialog] Blob created:', {
        size: blob.size,
        type: blob.type
      })

      if (blob.size === 0) {
        console.error('[Export Dialog] ❌ Empty blob received!')
        throw new Error('Export generated an empty file')
      }

      const url = window.URL.createObjectURL(blob)
      console.log('[Export Dialog] Object URL created:', url)

      const a = document.createElement('a')
      a.href = url

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      console.log('[Export Dialog] Content-Disposition:', contentDisposition)

      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch
        ? filenameMatch[1]
        : `receipts-${new Date().toISOString().split('T')[0]}.${selectedFormat === 'csv' ? 'csv' : 'xlsx'}`

      console.log('[Export Dialog] Filename:', filename)

      a.download = filename
      document.body.appendChild(a)

      console.log('[Export Dialog] Triggering download click...')
      a.click()

      // Small delay before cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        console.log('[Export Dialog] Download cleanup complete')
      }, 100)

      toast({
        title: 'Export successful',
        description: `${selectedIds.length} receipt${selectedIds.length === 1 ? '' : 's'} exported. File: ${filename}`,
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
      <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Receipts</DialogTitle>
          <DialogDescription>
            Export {selectedIds.length} selected receipt{selectedIds.length === 1 ? '' : 's'} to your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* SECTION 1: Standard Export */}
          <div className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Standard Export</h3>
                <p className="text-xs text-gray-500">Quick export to common formats</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
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
                    className={`h-7 w-7 ${
                      selectedFormat === 'excel'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-sm font-medium">Excel</div>
                  <div className="text-xs text-muted-foreground text-center">
                    Formatted with totals
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
                    className={`h-7 w-7 ${
                      selectedFormat === 'csv'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-sm font-medium">CSV</div>
                  <div className="text-xs text-muted-foreground text-center">
                    Plain text format
                  </div>
                </div>
              </button>

              {/* Custom Template Option - Only show if user has saved templates */}
              {customTemplates.length > 0 && (
                <button
                  onClick={() => setSelectedFormat('template')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedFormat === 'template'
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  disabled={isExporting}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles
                      className={`h-7 w-7 ${
                        selectedFormat === 'template'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <div className="text-sm font-medium">Saved</div>
                    <div className="text-xs text-muted-foreground text-center">
                      {customTemplates.length} {customTemplates.length === 1 ? 'template' : 'templates'}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Custom Template Selection */}
            {selectedFormat === 'template' && customTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select
                  value={selectedCustomTemplate}
                  onValueChange={setSelectedCustomTemplate}
                  disabled={isExporting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {customTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.template_name}</span>
                          {template.description && (
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ✓ Free to use • Used {customTemplates.find(t => t.id === selectedCustomTemplate)?.export_count || 0} times
                </p>
              </div>
            )}

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
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
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

            {/* Export Button for Standard Formats */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => handleExport()}
                disabled={isExporting || selectedIds.length === 0 || selectedIds.length > MAX_EXPORT_RECEIPTS || selectedFormat === 'smart-template'}
                className="w-full sm:w-auto"
              >
                {isExporting && selectedFormat !== 'smart-template' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export {selectedFormat === 'excel' ? 'Excel' : selectedFormat === 'csv' ? 'CSV' : 'Saved Template'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* SECTION 2: AI Template Export */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">AI-Powered Template Export</h3>
                <p className="text-xs text-blue-600">Upload your Excel template and let AI map fields automatically</p>
              </div>
            </div>

            {/* Template Upload Area */}
            <div className="mb-4">
              <Label className="block mb-2 text-sm font-medium">Upload Template File</Label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                uploadedTemplate
                  ? 'border-blue-500 bg-blue-100/50'
                  : 'border-blue-300 bg-white hover:bg-blue-50'
              } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleTemplateUpload}
                  className="hidden"
                  disabled={isExporting || isAnalyzing}
                />
                <div className="flex flex-col items-center gap-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Analyzing template...</p>
                    </>
                  ) : uploadedTemplate ? (
                    <>
                      <Upload className="h-10 w-10 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">{uploadedTemplate.name}</p>
                      <p className="text-xs text-blue-600">Click to upload a different file</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-blue-400" />
                      <p className="text-sm font-medium text-gray-700">Click to upload Excel template</p>
                      <p className="text-xs text-gray-500">Supports .xlsx and .xls files (max 5MB)</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* AI Analysis Preview */}
            {aiAnalysis && (
              <div className="space-y-3 bg-white/80 rounded-lg p-4 border border-blue-300">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Sheet</div>
                    <div className="font-medium text-sm">{aiAnalysis.sheetName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Start Row</div>
                    <div className="font-medium text-sm">{aiAnalysis.startRow}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div className="font-medium text-sm text-green-900">
                      {Object.keys(aiAnalysis.fieldMapping).length} Fields Mapped
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs max-h-40 overflow-y-auto">
                    {Object.entries(aiAnalysis.fieldMapping).map(([field, column]) => (
                      <div key={field} className="flex justify-between items-center bg-white/70 px-2 py-1 rounded">
                        <span className="text-gray-700">{field.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary" className="text-xs">
                          Col {column}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {aiAnalysis.aiAnalysis && (
                  <div className="text-xs text-gray-600 italic bg-yellow-50 border border-yellow-200 p-2 rounded">
                    💡 {aiAnalysis.aiAnalysis}
                  </div>
                )}

                {/* Save for Reuse Option */}
                <div className="border-t border-blue-200 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-for-reuse"
                      checked={saveForReuse}
                      onCheckedChange={(checked) => setSaveForReuse(checked as boolean)}
                    />
                    <Label htmlFor="save-for-reuse" className="text-sm cursor-pointer">
                      Save this template for future use (optional)
                    </Label>
                  </div>

                  {saveForReuse && (
                    <Input
                      placeholder="Template name (e.g., VAT Q4 2025)"
                      value={templateNameForSave}
                      onChange={(e) => setTemplateNameForSave(e.target.value)}
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Export with Template Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={async () => {
                  console.log('[Export Dialog] AI Template export button clicked', {
                    hasTemplate: !!uploadedTemplate,
                    hasAnalysis: !!aiAnalysis,
                    receiptCount: selectedIds.length
                  })

                  // Call export with smart-template format
                  await handleExport('smart-template')
                }}
                disabled={!aiAnalysis || isExporting || selectedIds.length === 0 || selectedIds.length > MAX_EXPORT_RECEIPTS}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Export with Template (20 credits)
                  </>
                )}
              </Button>
            </div>
          </div>

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
            <div className="text-sm font-medium">Export Summary</div>
            <div className="text-xs text-muted-foreground">
              • {selectedIds.length} receipt{selectedIds.length === 1 ? '' : 's'} selected
            </div>
            <div className="text-xs text-muted-foreground">
              • Only completed receipts will be included
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
