'use client'

import { FileCheck, Target, Clock, Shield, Lock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

const stats = [
  {
    icon: FileCheck,
    number: '10,000+',
    labelKey: 'receipts',
  },
  {
    icon: Target,
    number: '95%+',
    labelKey: 'accuracy',
  },
  {
    icon: Clock,
    number: '5 Hours',
    labelKey: 'timeSaved',
  },
]

const testimonials = [
  {
    avatar: 'SC',
    color: 'bg-blue-500',
    index: 0,
  },
  {
    avatar: 'MJ',
    color: 'bg-green-500',
    index: 1,
  },
  {
    avatar: 'JM',
    color: 'bg-purple-500',
    index: 2,
  },
]

const trustBadges = [
  {
    icon: Shield,
    key: 'securePayment',
  },
  {
    icon: CheckCircle2,
    key: 'gdpr',
  },
  {
    icon: Lock,
    key: 'encryption',
  },
]

export function SocialProof() {
  const t = useTranslations('socialProof')

  return (
    <section className="bg-muted/50 py-20">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t('title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {t(`stats.${stat.labelKey}`)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('testimonials.title')}
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.index} className="bg-background hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <svg
                      className="h-8 w-8 text-primary/30"
                      fill="currentColor"
                      viewBox="0 0 32 32"
                    >
                      <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    &ldquo;{t(`testimonials.items.${testimonial.index}.quote`)}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-semibold`}
                    >
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{t(`testimonials.items.${testimonial.index}.name`)}</div>
                      <div className="text-sm text-muted-foreground">
                        {t(`testimonials.items.${testimonial.index}.role`)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {trustBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.key}
                  className="flex items-center justify-center gap-3 p-4 rounded-lg bg-background/50"
                >
                  <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t(`trustBadges.${badge.key}`)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
