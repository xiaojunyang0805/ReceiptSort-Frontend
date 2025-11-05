import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, FileText, Upload, Calendar } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { ProcessAllButton } from '@/components/dashboard/ProcessAllButton'
import { LowCreditBanner } from '@/components/dashboard/LowCreditBanner'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch receipts stats
  const { count: totalReceipts } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  // Fetch receipts this month
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { count: receiptsThisMonth } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .gte('created_at', firstDayOfMonth.toISOString())

  // Fetch last export date
  const { data: lastExport } = await supabase
    .from('exports')
    .select('created_at')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch pending receipts
  const { data: pendingReceiptsData, count: pendingReceipts } = await supabase
    .from('receipts')
    .select('id', { count: 'exact' })
    .eq('user_id', user?.id)
    .eq('processing_status', 'pending')

  const hasReceipts = (totalReceipts ?? 0) > 0
  const hasPendingReceipts = (pendingReceipts ?? 0) > 0
  const pendingIds = (pendingReceiptsData ?? []).map(r => r.id)

  const lastExportDate = lastExport?.created_at
    ? new Date(lastExport.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : t('overview.lastExport.never')

  return (
    <div className="space-y-8 pb-72 md:pb-8">
      {/* Low Credit Banner */}
      <LowCreditBanner credits={profile?.credits ?? 0} />

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('welcome')}, {profile?.full_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('overview.subtitle')}
        </p>
      </div>

      {/* Credit Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('credits.balance')}
          </CardTitle>
          <CardDescription>{t('credits.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {profile?.credits ?? 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('credits.creditsRemaining')}
          </p>
          <Button asChild className="mt-4">
            <Link href="/credits">{t('credits.buyCredits')}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('receiptsTable.title')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t('stats.allTimeProcessed')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('timePeriods.thisMonth')}</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receiptsThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">{t('stats.receiptsUploaded')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('exports.title')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastExportDate}</div>
            <p className="text-xs text-muted-foreground">{t('stats.mostRecentExport')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State or Actions */}
      {!hasReceipts ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('getStarted.title')}</CardTitle>
            <CardDescription>
              {t('getStarted.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                {t('getStarted.uploadButton')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : hasPendingReceipts ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('pendingReceipts.title')}</CardTitle>
            <CardDescription>
              {(pendingReceipts ?? 0) === 1
                ? t('pendingReceipts.description', { count: pendingReceipts ?? 0 })
                : t('pendingReceipts.descriptionPlural', { count: pendingReceipts ?? 0 })
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProcessAllButton
              pendingCount={pendingReceipts ?? 0}
              pendingIds={pendingIds}
              userCredits={profile?.credits ?? 0}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
