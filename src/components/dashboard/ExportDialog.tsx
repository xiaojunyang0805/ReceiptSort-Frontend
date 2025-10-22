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
import { FileSpreadsheet, FileText, Loader2, Download, Sparkles, Upload, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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

// Template Card Component with expand/collapse
interface TemplateCardProps {
  template: CustomTemplate
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  isSelected: boolean
}

function TemplateCard({ template, onSelect, onDelete, isSelected }: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`border-2 rounded-lg p-3 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Collapsed View */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <h5 className="text-sm font-medium truncate">{template.template_name}</h5>
          </div>
          {!isExpanded && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Used {template.export_count}x</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {template.description && (
            <p className="text-xs text-gray-600">{template.description}</p>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Used</span>
            <span className="font-medium">{template.export_count} times</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(template.id)}
              className="flex-1 h-8"
            >
              Select
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template.id)}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [activeExportFormat, setActiveExportFormat] = useState<ExportFormat | null>(null) // Track which button is actually exporting
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

      // Set default template name from filename
      const defaultName = file.name.replace(/\.(xlsx|xls)$/i, '')
      setTemplateNameForSave(defaultName)

      toast({
        title: 'Template analyzed!',
        description: `AI detected ${Object.keys(data.analysis.fieldMapping).length} field mappings. Click Save to store it.`,
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

  const autoSaveTemplate = async (file: File, analysis: AIAnalysis, templateName: string) => {
    try {
      console.log('[Export Dialog] Auto-saving template...', {
        fileName: file.name,
        fileSize: file.size,
        templateName,
        analysisSheetName: analysis.sheetName,
        analysisStartRow: analysis.startRow,
        fieldMappingCount: Object.keys(analysis.fieldMapping).length,
      })

      // Use provided template name
      const finalTemplateName = templateName.trim() || file.name.replace(/\.(xlsx|xls)$/i, '')

      // Convert file to base64
      console.log('[Export Dialog] Converting file to base64...')
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64String = result.split(',')[1]
          console.log('[Export Dialog] Base64 conversion complete, length:', base64String.length)
          resolve(base64String)
        }
        reader.onerror = (error) => {
          console.error('[Export Dialog] FileReader error:', error)
          reject(error)
        }
        reader.readAsDataURL(file)
      })

      console.log('[Export Dialog] Sending save request to API...')
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: finalTemplateName,
          description: `Saved from ${file.name}`,
          sheetName: analysis.sheetName,
          startRow: analysis.startRow,
          fieldMapping: analysis.fieldMapping,
          templateFile: base64,
        }),
      })

      console.log('[Export Dialog] Response status:', response.status)
      const data = await response.json()
      console.log('[Export Dialog] Response data:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        // Don't show error if template already exists
        if (data.error?.includes('already exists')) {
          console.log('[Export Dialog] Template already exists, skipping auto-save')
          toast({
            title: 'Template exists',
            description: `"${finalTemplateName}" is already saved`,
            variant: 'default',
          })
          return
        }

        // Show detailed error to user
        toast({
          title: 'Failed to save template',
          description: `Error: ${data.error || 'Unknown error'} (Status: ${response.status})`,
          variant: 'destructive',
        })
        throw new Error(data.error || 'Failed to save template')
      }

      console.log('[Export Dialog] Template auto-saved successfully:', data.template.id)

      // Refresh template list immediately
      await fetchCustomTemplates()

      toast({
        title: 'Template saved!',
        description: `"${finalTemplateName}" is now available for reuse (FREE)`,
      })
    } catch (error) {
      console.error('[Export Dialog] Auto-save failed:', error)

      // Show error to user with details
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async (overrideFormat?: ExportFormat) => {
    if (selectedIds.length === 0) return

    const exportFormat = overrideFormat || selectedFormat

    console.log('[Export Dialog] ========== EXPORT STARTED ==========')
    console.log('[Export Dialog] overrideFormat:', overrideFormat)
    console.log('[Export Dialog] selectedFormat:', selectedFormat)
    console.log('[Export Dialog] Final exportFormat:', exportFormat)
    console.log('[Export Dialog] selectedCustomTemplate:', selectedCustomTemplate)
    console.log('[Export Dialog] has aiAnalysis:', !!aiAnalysis)
    console.log('[Export Dialog] has uploadedTemplate:', !!uploadedTemplate)

    setIsExporting(true)
    setActiveExportFormat(exportFormat) // Track which format is actively exporting

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
        // Smart template export - can use either uploaded template OR saved template

        // Check if we have either an uploaded template with AI analysis OR a saved template selected
        if (uploadedTemplate && aiAnalysis) {
          // Case 1: Using newly uploaded template with AI analysis
          endpoint = '/api/export/smart-template'

          console.log('[Export Dialog] Processing uploaded template:', {
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
        } else if (selectedCustomTemplate) {
          // Case 2: Using saved template
          endpoint = '/api/export/template'

          console.log('[Export Dialog] Processing saved template:', {
            templateId: selectedCustomTemplate,
            receiptCount: selectedIds.length,
          })

          requestBody = {
            receipt_ids: selectedIds,
            template_id: selectedCustomTemplate,
          }
        } else {
          // No template available
          toast({
            title: 'Template required',
            description: 'Please upload a new template or select a saved template',
            variant: 'destructive',
          })
          setIsExporting(false)
          setActiveExportFormat(null)
          return
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
      setActiveExportFormat(null)
    }
  }


  // Shared content component
  const ExportContent = () => (
    <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 overflow-y-auto flex-1">
          {/* SECTION 1: Standard Export */}
          <div className="border rounded-lg p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Standard Export</h3>
                <p className="text-xs text-gray-500">Quick export to common formats</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {/* Excel Option */}
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                disabled={isExporting}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <FileSpreadsheet
                    className={`h-5 w-5 sm:h-7 sm:w-7 ${
                      selectedFormat === 'excel'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-xs sm:text-sm font-medium">Excel</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    Formatted with totals
                  </div>
                </div>
              </button>

              {/* CSV Option */}
              <button
                onClick={() => setSelectedFormat('csv')}
                className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                disabled={isExporting}
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <FileText
                    className={`h-5 w-5 sm:h-7 sm:w-7 ${
                      selectedFormat === 'csv'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-xs sm:text-sm font-medium">CSV</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                    Plain text format
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
                disabled={isExporting || selectedIds.length === 0 || selectedIds.length > MAX_EXPORT_RECEIPTS}
                className="w-full sm:w-auto"
              >
                {isExporting && activeExportFormat !== 'smart-template' && (activeExportFormat === selectedFormat || activeExportFormat === 'excel' || activeExportFormat === 'csv') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export {selectedFormat === 'excel' ? 'Excel' : selectedFormat === 'csv' ? 'CSV' : 'Format'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* SECTION 2: AI Template Export */}
          <div className="border-2 border-blue-200 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">AI-Powered Template Export</h3>
                <p className="text-xs text-blue-600 hidden sm:block">Upload your Excel template and let AI map fields automatically</p>
              </div>
            </div>

            {/* Two-column layout: Upload New (Left) | Use Saved (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT COLUMN: Upload New Template */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Upload New Template</h4>

                {/* Template Upload Area */}
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
                        <p className="text-sm font-medium text-blue-900">Analyzing...</p>
                      </>
                    ) : uploadedTemplate ? (
                      <>
                        <Upload className="h-10 w-10 text-blue-600" />
                        <p className="text-sm font-medium text-blue-900">{uploadedTemplate.name}</p>
                        <p className="text-xs text-blue-600">Click to change</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-blue-400" />
                        <p className="text-sm font-medium text-gray-700">Click to upload</p>
                        <p className="text-xs text-gray-500">.xlsx, .xls (max 5MB)</p>
                      </>
                    )}
                  </div>
                </label>

                {/* AI Analysis Preview */}
                {aiAnalysis && (
                  <div className="space-y-3 bg-white/80 rounded-lg p-3 border border-blue-300">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-600">Sheet</div>
                        <div className="font-medium text-sm">{aiAnalysis.sheetName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Start Row</div>
                        <div className="font-medium text-sm">{aiAnalysis.startRow}</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded p-2 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="font-medium text-xs text-green-900">
                          {Object.keys(aiAnalysis.fieldMapping).length} Fields Mapped
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs max-h-32 overflow-y-auto">
                        {Object.entries(aiAnalysis.fieldMapping).map(([field, column]) => (
                          <div key={field} className="flex justify-between items-center bg-white/70 px-2 py-1 rounded">
                            <span className="text-gray-700 truncate">{field.replace(/_/g, ' ')}</span>
                            <Badge variant="secondary" className="text-xs ml-1">
                              {column}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Template Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="template-name" className="text-xs">
                        Template Name
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="template-name"
                          placeholder="e.g., VAT Q4 2025"
                          value={templateNameForSave}
                          onChange={(e) => setTemplateNameForSave(e.target.value)}
                          className="text-sm h-8 flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (uploadedTemplate && aiAnalysis && templateNameForSave.trim()) {
                              await autoSaveTemplate(uploadedTemplate, aiAnalysis, templateNameForSave)
                            }
                          }}
                          disabled={!templateNameForSave.trim() || isAnalyzing}
                          className="h-8"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Click Save to store template for reuse (FREE)
                      </p>
                    </div>

                    {/* Info message */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                      💡 Click Save button above to store this template
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Use Saved Templates */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Use Saved Template</h4>

                {customTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FileSpreadsheet className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No saved templates</p>
                    <p className="text-xs text-gray-400">Upload and save to reuse</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {customTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={(id) => {
                          setSelectedCustomTemplate(id)
                          // TODO: Load template and trigger export
                        }}
                        onDelete={async (id) => {
                          try {
                            const response = await fetch(`/api/templates?id=${id}`, {
                              method: 'DELETE',
                            })
                            if (response.ok) {
                              toast({
                                title: 'Template deleted',
                                description: 'Template has been removed',
                              })
                              fetchCustomTemplates()
                            }
                          } catch (error) {
                            toast({
                              title: 'Delete failed',
                              description: 'Failed to delete template',
                              variant: 'destructive',
                            })
                          }
                        }}
                        isSelected={selectedCustomTemplate === template.id}
                      />
                    ))}
                  </div>
                )}
              </div>
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

          {/* Export with Template Button - Always visible at bottom */}
          <div className="flex justify-end pt-2 pb-4">
            <Button
              onClick={async () => {
                console.log('[Export Dialog] Template export button clicked', {
                  hasUploadedTemplate: !!uploadedTemplate,
                  hasAiAnalysis: !!aiAnalysis,
                  selectedCustomTemplate: selectedCustomTemplate,
                  receiptCount: selectedIds.length
                })
                await handleExport('smart-template')
              }}
              disabled={
                isExporting ||
                selectedIds.length === 0 ||
                selectedIds.length > MAX_EXPORT_RECEIPTS ||
                (!aiAnalysis && !selectedCustomTemplate) // Disabled only if neither uploaded nor saved template is selected
              }
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isExporting && activeExportFormat === 'smart-template' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Export with Template (1 credit)
                </>
              )}
            </Button>
          </div>
        </div>
  )

  // Use Dialog everywhere - full-screen on mobile, centered on desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none lg:w-auto lg:h-auto lg:max-w-6xl lg:max-h-[90vh] flex flex-col p-0 gap-0 lg:rounded-lg">
        <DialogHeader className="px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-lg lg:text-xl">Export Receipts</DialogTitle>
          <DialogDescription className="text-sm">
            Export {selectedIds.length} selected receipt{selectedIds.length === 1 ? '' : 's'} to your preferred format
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 min-h-0">
          <ExportContent />
        </div>
        <DialogFooter className="px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting} className="w-full lg:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
