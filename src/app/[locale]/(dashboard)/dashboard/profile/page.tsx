import { Metadata } from 'next'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Profile | ReceiptSort',
  description: 'Manage your profile settings',
}

export default async function ProfilePage() {
  const t = await getTranslations('dashboard.profile')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <ProfileForm />
    </div>
  )
}
