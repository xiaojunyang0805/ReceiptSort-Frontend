import { createClient } from '@/lib/supabase/server'
import ReceiptUpload from '@/components/dashboard/ReceiptUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getTranslations } from 'next-intl/server'

export default async function UploadPage() {
  const t = await getTranslations('dashboard')
  const tHowItWorks = await getTranslations('howItWorks')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch recent uploads (last 5)
  const { data: recentReceipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('uploadSection.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('uploadSection.dragDrop')}
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{tHowItWorks('title')}</CardTitle>
          <CardDescription>{tHowItWorks('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>{tHowItWorks('steps.upload.description')}</li>
            <li>{t('uploadSection.supported')}</li>
            <li>{t('uploadSection.multipleFiles')}</li>
            <li>{t('uploadSection.secureStorage')}</li>
            <li>{t('uploadSection.creditCost')}</li>
          </ol>
        </CardContent>
      </Card>

      {/* Upload Component */}
      <ReceiptUpload />

      {/* Recent Uploads */}
      {recentReceipts && recentReceipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Uploads
            </CardTitle>
            <CardDescription>Your most recently uploaded receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{receipt.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(receipt.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        receipt.processing_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : receipt.processing_status === 'processing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : receipt.processing_status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {receipt.processing_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
