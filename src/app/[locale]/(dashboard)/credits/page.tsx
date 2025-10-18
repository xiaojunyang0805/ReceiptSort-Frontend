import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { CreditHistory } from '@/components/dashboard/CreditHistory'
import { SuccessMessage } from '@/components/dashboard/SuccessMessage'
import { CreditPackages } from '@/components/dashboard/CreditPackages'
import { getTranslations } from 'next-intl/server'

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

      {/* Transaction History */}
      <CreditHistory />
    </div>
  )
}
