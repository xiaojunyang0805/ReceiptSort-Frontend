'use client'

import { Building2, Stethoscope, Globe2, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

export function UseCases() {
  const t = useTranslations('useCases')
  const tPricing = useTranslations('pricing')

  const useCases = [
    {
      icon: Building2,
      emoji: '🏢',
      key: 'accountant',
    },
    {
      icon: Stethoscope,
      emoji: '🏥',
      key: 'medical',
    },
    {
      icon: Globe2,
      emoji: '🇪🇺',
      key: 'euFreelancer',
    },
    {
      icon: TrendingUp,
      emoji: '📊',
      key: 'variableVolume',
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {useCases.map((useCase) => {
            const Icon = useCase.icon
            return (
              <Card
                key={useCase.key}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{useCase.emoji}</div>
                    <div>
                      <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                        {t(`items.${useCase.key}.tag`)}
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {t(`items.${useCase.key}.title`)}
                      </h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`items.${useCase.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button size="lg" asChild className="text-lg px-8 py-6 h-auto">
            <Link href="/signup">
              {tPricing('tryItFree')}
              <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
