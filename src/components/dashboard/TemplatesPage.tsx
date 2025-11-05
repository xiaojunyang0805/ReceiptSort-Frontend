'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { TEMPLATE_PRICING } from '@/lib/template-pricing'
import TemplateUploadDialog from './TemplateUploadDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Template {
  id: string
  template_name: string
  description: string | null
  sheet_name: string
  start_row: number
  field_mapping: Record<string, string>
  export_count: number
  last_used_at: string | null
  credits_spent: number
  created_at: string
  file_path: string
  file_url: string | null
}

interface TemplateQuota {
  used: number
  max: number
  remaining: number
}

export default function TemplatesPage() {
  const t = useTranslations('dashboard.templates')
  const tCommon = useTranslations('common')

  const [templates, setTemplates] = useState<Template[]>([])
  const [quota, setQuota] = useState<TemplateQuota>({
    used: 0,
    max: TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER,
    remaining: TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates || [])
      setQuota(data.quota || quota)
    } catch (error) {
      console.error('[Templates] Fetch error:', error)
      toast.error(t('errors.fetchFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/templates?id=${templateToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete template')
      }

      toast.success(t('deleteSuccess'))
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
      fetchTemplates()
    } catch (error) {
      console.error('[Templates] Delete error:', error)
      toast.error(t('errors.deleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (template: Template) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const quotaPercent = quota.max > 0 ? (quota.used / quota.max) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Quota Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('quota.title')}</CardTitle>
              <CardDescription>{t('quota.description')}</CardDescription>
            </div>
            <Badge variant={quota.remaining > 0 ? 'default' : 'destructive'}>
              {quota.used} / {quota.max}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={quotaPercent} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('quota.remaining', { count: quota.remaining })}
          </p>
        </CardContent>
      </Card>

      {/* Create Template Button */}
      <div className="mb-6">
        <Button
          onClick={() => setUploadDialogOpen(true)}
          disabled={quota.remaining === 0}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('createButton')}
        </Button>
        {quota.remaining === 0 && (
          <p className="text-sm text-destructive mt-2">
            {t('quota.limitReached')}
          </p>
        )}
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noTemplates')}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t('noTemplatesDescription')}
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createFirstTemplate')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">{template.template_name}</CardTitle>
                  </div>
                </div>
                {template.description && (
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('exportCount')}</span>
                    <span className="font-medium">{template.export_count}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('fieldsMapped')}</span>
                    <span className="font-medium">
                      {Object.keys(template.field_mapping).length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {t('created')}{' '}
                      {formatDistanceToNow(new Date(template.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {template.last_used_at && (
                    <div className="text-xs text-muted-foreground">
                      {t('lastUsed')}{' '}
                      {formatDistanceToNow(new Date(template.last_used_at), {
                        addSuffix: true,
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDeleteDialog(template)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {tCommon('delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            {t('info.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ {t('info.point1', { credits: TEMPLATE_PRICING.COST_PER_EXPORT })}</p>
          <p>✓ {t('info.point2')}</p>
          <p>✓ {t('info.point3')}</p>
          <p>✓ {t('info.point4')}</p>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <TemplateUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchTemplates}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', {
                name: templateToDelete?.template_name || '',
              })}
              <br />
              <br />
              {t('deleteDialog.warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('deleteDialog.deleting')}
                </>
              ) : (
                tCommon('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
