'use client'

import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

export function WhatMakesUsDifferent() {
  const t = useTranslations('whatMakesUsDifferent')

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Other Tools */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                {t('others.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{t('others.fixedFormat')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{t('others.manualReorganization')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{t('others.subscription')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{t('others.receiptsOnly')}</span>
                </div>
              </div>
            </div>

            {/* Right Column - ReceiptSort */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-300 shadow-lg relative">
              {/* Highlight badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {t('receiptSort.badge')}
                </span>
              </div>

              <h3 className="text-xl font-bold text-blue-900 mb-6 text-center">
                {t('receiptSort.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900 font-medium">{t('receiptSort.aiAdapts')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900 font-medium">{t('receiptSort.yourFormat')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900 font-medium">{t('receiptSort.payPerDocument')}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900 font-medium">{t('receiptSort.allDocuments')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom text and CTA */}
          <div className="mt-12 text-center space-y-6">
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {t('savingsText')}
              <br />
              <span className="font-semibold text-blue-700">{t('freeTemplates')}</span>
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6 h-auto">
              <Link href="#demo">
                {t('cta')}
                <span className="ml-2">→</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
