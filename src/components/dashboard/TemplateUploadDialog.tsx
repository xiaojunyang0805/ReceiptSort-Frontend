'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  X,
  Coins,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  TEMPLATE_PRICING,
  RECEIPT_FIELDS,
  validateTemplateFile,
  formatFileSize,
} from '@/lib/template-pricing'

interface TemplateUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Step = 'upload' | 'configure' | 'confirm'

interface UploadedFile {
  file: File
  path: string
  url: string
}

interface TemplateConfig {
  name: string
  description: string
  sheetName: string
  startRow: number
  fieldMapping: Record<string, string>
}

export default function TemplateUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: TemplateUploadDialogProps) {
  const t = useTranslations('dashboard.templates.uploadDialog')
  const tCommon = useTranslations('common')

  const [step, setStep] = useState<Step>('upload')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [config, setConfig] = useState<TemplateConfig>({
    name: '',
    description: '',
    sheetName: 'Sheet1',
    startRow: 3,
    fieldMapping: {},
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch user credits when dialog opens
  useState(() => {
    if (open) {
      fetchUserCredits()
    }
  })

  const fetchUserCredits = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserCredits(profile.credits)
      }
    } catch (error) {
      console.error('[Template Upload] Failed to fetch credits:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateTemplateFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setIsUploading(true)

    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadedFile({
        file,
        path: data.file.path,
        url: data.file.url,
      })

      // Auto-fill template name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setConfig((prev) => ({
        ...prev,
        name: nameWithoutExt,
      }))

      toast.success(t('uploadSuccess'))
      setStep('configure')
    } catch (error: any) {
      console.error('[Template Upload] Error:', error)
      toast.error(error.message || t('uploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddField = (receiptField: string, columnLetter: string) => {
    if (!columnLetter) return

    setConfig((prev) => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [receiptField]: columnLetter.toUpperCase(),
      },
    }))
  }

  const handleRemoveField = (receiptField: string) => {
    setConfig((prev) => {
      const newMapping = { ...prev.fieldMapping }
      delete newMapping[receiptField]
      return {
        ...prev,
        fieldMapping: newMapping,
      }
    })
  }

  const handleSave = async () => {
    if (!uploadedFile) return

    // Validation
    if (!config.name.trim()) {
      toast.error(t('errors.nameRequired'))
      return
    }

    if (Object.keys(config.fieldMapping).length === 0) {
      toast.error(t('errors.mappingRequired'))
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: config.name,
          description: config.description || null,
          filePath: uploadedFile.path,
          fileUrl: uploadedFile.url,
          fileSize: uploadedFile.file.size,
          sheetName: config.sheetName,
          startRow: config.startRow,
          fieldMapping: config.fieldMapping,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Save failed')
      }

      toast.success(t('saveSuccess', { credits: data.template.creditsCharged }))
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('[Template Save] Error:', error)
      toast.error(error.message || t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setUploadedFile(null)
    setConfig({
      name: '',
      description: '',
      sheetName: 'Sheet1',
      startRow: 3,
      fieldMapping: {},
    })
    setIsUploading(false)
    setIsSaving(false)
    onOpenChange(false)
  }

  const canProceedToConfirm =
    config.name.trim() && Object.keys(config.fieldMapping).length > 0

  const hasEnoughCredits = userCredits >= TEMPLATE_PRICING.COST_PER_EXPORT

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'upload'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              {step !== 'upload' ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">{t('steps.upload')}</span>
          </div>

          <div className="flex-1 h-px bg-border mx-4" />

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'configure'
                  ? 'bg-primary text-primary-foreground'
                  : step === 'confirm'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step === 'confirm' ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-sm font-medium">{t('steps.configure')}</span>
          </div>

          <div className="flex-1 h-px bg-border mx-4" />

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'confirm'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium">{t('steps.confirm')}</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('uploading')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('clickToUpload')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('fileTypes')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('maxSize', { size: TEMPLATE_PRICING.MAX_TEMPLATE_FILE_SIZE_MB })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('uploadHint')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && uploadedFile && (
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploadedFile(null)
                  setStep('upload')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Basic info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">{t('fields.name')}</Label>
                <Input
                  id="template-name"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t('placeholders.name')}
                />
              </div>

              <div>
                <Label htmlFor="template-description">{t('fields.description')}</Label>
                <Textarea
                  id="template-description"
                  value={config.description}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={t('placeholders.description')}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sheet-name">{t('fields.sheetName')}</Label>
                  <Input
                    id="sheet-name"
                    value={config.sheetName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, sheetName: e.target.value }))
                    }
                    placeholder="Sheet1"
                  />
                </div>

                <div>
                  <Label htmlFor="start-row">{t('fields.startRow')}</Label>
                  <Input
                    id="start-row"
                    type="number"
                    min="1"
                    value={config.startRow}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        startRow: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Field mapping */}
            <div>
              <Label className="text-base mb-3 block">{t('fields.mapping')}</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                {RECEIPT_FIELDS.map((field) => {
                  const isMapped = field.key in config.fieldMapping

                  return (
                    <div
                      key={field.key}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded"
                    >
                      <span className="flex-1 text-sm">{field.label}</span>
                      {isMapped ? (
                        <>
                          <Badge variant="secondary">
                            Column {config.fieldMapping[field.key]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(field.key)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Input
                          placeholder="A"
                          className="w-16 h-8 text-center"
                          maxLength={3}
                          onChange={(e) => handleAddField(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('mappingHint')} ({Object.keys(config.fieldMapping).length} {t('fieldsMapped')})
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                {tCommon('back')}
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!canProceedToConfirm}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">{t('confirm.title')}</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fields.name')}:</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fields.sheetName')}:</span>
                  <span className="font-medium">{config.sheetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fields.startRow')}:</span>
                  <span className="font-medium">{config.startRow}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('fieldsMapped')}:</span>
                  <span className="font-medium">
                    {Object.keys(config.fieldMapping).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit charge info */}
            <Alert className={hasEnoughCredits ? 'border-blue-200 bg-blue-50' : 'border-destructive bg-destructive/10'}>
              <Coins className={`h-4 w-4 ${hasEnoughCredits ? 'text-blue-600' : 'text-destructive'}`} />
              <AlertDescription>
                <p className="font-medium mb-1">
                  {t('confirm.creditCharge', { credits: TEMPLATE_PRICING.COST_PER_EXPORT })}
                </p>
                <p className="text-sm">
                  {t('confirm.balance', { balance: userCredits })}
                </p>
                {!hasEnoughCredits && (
                  <p className="text-sm text-destructive mt-1">
                    {t('confirm.insufficientCredits')}
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">{t('confirm.benefits')}</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>✓ {t('confirm.benefit1')}</li>
                  <li>✓ {t('confirm.benefit2')}</li>
                  <li>✓ {t('confirm.benefit3')}</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('configure')}>
                {tCommon('back')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasEnoughCredits}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('confirm.saving')}
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    {t('confirm.createTemplate')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
