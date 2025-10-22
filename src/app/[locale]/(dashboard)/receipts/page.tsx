import ReceiptList from '@/components/dashboard/ReceiptList'
import { getTranslations } from 'next-intl/server'

export default async function ReceiptsPage() {
  const t = await getTranslations('dashboard.receiptsTable')
  const tPage = await getTranslations('dashboard.receiptsPage')

  return (
    <div className="space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {tPage('subtitle')}
        </p>
      </div>

      {/* Receipt List */}
      <ReceiptList />
    </div>
  )
}
