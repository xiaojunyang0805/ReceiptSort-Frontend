/**
 * Account Settings Page
 *
 * Central page for user account management including:
 * - Profile information
 * - Email and password settings
 * - Account preferences
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, CreditCard, FileText } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { ProfileForm } from '@/components/account/ProfileForm'

export default async function AccountPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const t = await getTranslations('account')

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl pb-72 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('profileTitle')}
            </CardTitle>
            <CardDescription>{t('profileDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Editable Name Field */}
            <ProfileForm initialName={profile?.full_name || null} />

            {/* Read-only Email */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('email')}
              </label>
              <p className="text-base font-medium flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('emailCannotChange')}
              </p>
            </div>

            {/* Read-only User ID */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('userId')}
              </label>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Credits Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('creditsTitle')}
            </CardTitle>
            <CardDescription>{t('creditsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('currentCredits')}</p>
                <p className="text-3xl font-bold text-primary">{profile?.credits ?? 0}</p>
              </div>
              <Button asChild>
                <Link href="/credits">
                  {t('purchaseCredits')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing & Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('billingTitle')}
            </CardTitle>
            <CardDescription>{t('billingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/billing">
                {t('viewBilling')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Account Created */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {t('accountCreated')}: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
