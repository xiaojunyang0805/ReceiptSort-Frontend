'use client'

import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function FinalCTA() {
  const t = useTranslations('finalCTA')
  const tPricing = useTranslations('pricing')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-20 sm:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
            {t('title')}
          </h2>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-primary-foreground/90 sm:text-xl">
            {t('subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group h-12 px-8 text-base font-semibold shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <Link href="/signup">
                {tPricing('tryItFree')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-2 border-primary-foreground/20 bg-transparent px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/pricing">
                {t('viewPricing')}
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="space-y-6">
            <p className="text-base text-primary-foreground/90">
              {t('trustIndicator')}
            </p>

            {/* Trust badges grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span>{t('trustBadges.creditsNeverExpire')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span>{t('trustBadges.templatesReusable')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span>{t('trustBadges.moneyBack')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span>{t('trustBadges.allSoftware')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
