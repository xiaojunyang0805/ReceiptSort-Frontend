'use client'

import { Upload, Sparkles, Download, DollarSign, Shield, Clock, FileSparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export function Features() {
  const t = useTranslations('features')

  const features = [
    {
      icon: Upload,
      titleKey: 'items.upload.title',
      descriptionKey: 'items.upload.description',
    },
    {
      icon: Sparkles,
      titleKey: 'items.aiExtraction.title',
      descriptionKey: 'items.aiExtraction.description',
    },
    {
      icon: Download,
      titleKey: 'items.export.title',
      descriptionKey: 'items.export.description',
    },
    {
      icon: FileSparkles,
      titleKey: 'items.aiTemplates.title',
      descriptionKey: 'items.aiTemplates.description',
    },
    {
      icon: DollarSign,
      titleKey: 'items.pricing.title',
      descriptionKey: 'items.pricing.description',
    },
    {
      icon: Shield,
      titleKey: 'items.security.title',
      descriptionKey: 'items.security.description',
    },
    {
      icon: Clock,
      titleKey: 'items.timeSaving.title',
      descriptionKey: 'items.timeSaving.description',
    },
  ]

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {t('title')}
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card
              key={index}
              className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50"
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{t(feature.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {t(feature.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
