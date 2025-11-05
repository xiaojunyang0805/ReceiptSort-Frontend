'use client'

import { Button } from '@/components/ui/button'
import { Check, Play } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export function Hero() {
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('hero')

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo')
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-gray-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              {t('headline')}
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              {t('subheadline')}
              <br />
              {t('subheadlineDetails')}
            </p>

            {/* Process Tagline */}
            <p className="text-base md:text-lg text-gray-700 font-medium">
              {t('processTagline')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/signup">
                  {t('getStarted', { defaultValue: 'Start Free' })}
                  <span className="ml-2">→</span>
                </Link>
              </Button>

              <Button
                onClick={scrollToDemo}
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6 h-auto font-semibold"
              >
                <Play className="h-5 w-5 mr-2" />
                {t('watchDemo')}
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="flex flex-col gap-3 pt-8 text-sm md:text-base">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{t('valueProps.freeCredits')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{t('valueProps.neverExpire')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{t('valueProps.multiDocument')}</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Demo */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="relative">
              {/* Demo Container */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                {/* Receipt to Data Animation */}
                <div className="space-y-4">
                  {/* Step 1: Receipt */}
                  <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                    <div className="text-gray-800 space-y-2.5">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Receipt</div>
                      <div className="h-2 bg-gray-100 rounded-full w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded-full w-1/2"></div>
                      <div className="h-2 bg-gray-100 rounded-full w-2/3"></div>
                      <div className="border-t border-gray-100 pt-2.5 mt-2.5">
                        <div className="h-2.5 bg-blue-500 rounded-full w-1/3"></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-blue-500 text-2xl">↓</div>
                  </div>

                  {/* Step 2: Extracted Data */}
                  <div className="bg-blue-50/50 rounded-lg p-5 shadow-sm border border-blue-100/50">
                    <div className="text-gray-800 space-y-2">
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Extracted Data</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium text-gray-600">Merchant:</div>
                        <div className="text-gray-900">Starbucks</div>
                        <div className="font-medium text-gray-600">Date:</div>
                        <div className="text-gray-900">2025-10-05</div>
                        <div className="font-medium text-gray-600">Total:</div>
                        <div className="text-blue-600 font-semibold">$24.50</div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-blue-500 text-2xl">↓</div>
                  </div>

                  {/* Step 3: Excel Download */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 shadow-sm border border-green-100">
                    <div className="text-center space-y-1.5">
                      <div className="text-2xl">📊</div>
                      <div className="font-semibold text-sm text-green-700">Download Excel</div>
                      <div className="text-xs text-green-600">Ready in seconds</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Accent - Very subtle */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave - Subtle */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-24 text-white fill-current"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
        </svg>
      </div>
    </section>
  )
}
