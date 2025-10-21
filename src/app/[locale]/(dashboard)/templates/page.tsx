import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import TemplatesPage from '@/components/dashboard/TemplatesPage'

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'dashboard.templates' })

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default function Templates() {
  return <TemplatesPage />
}
