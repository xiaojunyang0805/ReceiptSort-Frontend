'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditPackages } from './CreditPackages'
import { SubscriptionPlans } from './SubscriptionPlans'
import { ShoppingCart, Repeat } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function PurchaseToggle() {
  const [activeTab, setActiveTab] = useState('one-time')
  const t = useTranslations('dashboard.credits')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
        <TabsTrigger value="one-time" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {t('oneTimePurchase')}
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          {t('monthlySubscription')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="one-time">
        <CreditPackages />
      </TabsContent>

      <TabsContent value="subscription">
        <SubscriptionPlans />
      </TabsContent>
    </Tabs>
  )
}
