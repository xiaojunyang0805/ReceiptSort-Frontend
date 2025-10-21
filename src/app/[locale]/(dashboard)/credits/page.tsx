import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, FileSpreadsheet, Coins } from 'lucide-react'
import { CreditHistory } from '@/components/dashboard/CreditHistory'
import { SuccessMessage } from '@/components/dashboard/SuccessMessage'
import { CreditPackages } from '@/components/dashboard/CreditPackages'
import { getTranslations } from 'next-intl/server'
import { TEMPLATE_PRICING } from '@/lib/template-pricing'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CreditsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CreditsPage({ searchParams }: CreditsPageProps) {
  const t = await getTranslations('dashboard.credits')
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

  // Get search params
  const params = await searchParams
  const success = params.success === 'true'
  const canceled = params.canceled === 'true'
  const sessionId = params.session_id as string | undefined

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('manageSubtitle')}
        </p>
      </div>

      {/* Success/Cancel Messages */}
      {(success || canceled) && (
        <SuccessMessage
          success={success}
          canceled={canceled}
          sessionId={sessionId}
          currentCredits={profile?.credits ?? 0}
        />
      )}

      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('balance')}
          </CardTitle>
          <CardDescription>{t('availableCredits')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary">
            {profile?.credits ?? 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('creditsRemaining')}
          </p>
        </CardContent>
      </Card>

      {/* Purchase Options */}
      <CreditPackages />

      {/* Custom Templates Feature */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            {t('templates.title')}
          </CardTitle>
          <CardDescription>{t('templates.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('templates.cost')}</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="font-bold text-lg">{TEMPLATE_PRICING.COST_PER_TEMPLATE}</span>
                <span className="text-sm text-muted-foreground">{t('templates.credits')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('templates.maxTemplates')}</span>
              <span className="font-medium">{TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('templates.exportCost')}</span>
              <span className="font-medium text-green-600">{t('templates.free')}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">{t('templates.perfectFor')}</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ {t('templates.useCase1')}</li>
              <li>✓ {t('templates.useCase2')}</li>
              <li>✓ {t('templates.useCase3')}</li>
              <li>✓ {t('templates.useCase4')}</li>
            </ul>
          </div>

          <Link href="/templates">
            <Button className="w-full" variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t('templates.manageButton')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <CreditHistory />
    </div>
  )
}
