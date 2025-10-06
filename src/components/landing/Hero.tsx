'use client'

import { Button } from '@/components/ui/button'
import { Check, Play } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Hero() {
  const [mounted, setMounted] = useState(false)

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
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
              Stop Wasting Hours on{' '}
              <span className="text-blue-600">Receipt Entry</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Extract data from receipts in seconds with AI. Upload receipts → AI extracts data → Download Excel.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/signup">
                  Start Free
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
                Watch Demo
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="grid sm:grid-cols-3 gap-4 pt-8 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">10 free credits • No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">95%+ accuracy • GDPR compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">Exports to Excel/CSV</span>
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
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-2xl">
                {/* Receipt to Data Animation */}
                <div className="space-y-6">
                  {/* Step 1: Receipt */}
                  <div className="bg-gray-50 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform border border-gray-200">
                    <div className="text-gray-800 space-y-3">
                      <div className="text-xs font-mono text-gray-500">RECEIPT</div>
                      <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                      <div className="border-t border-dashed border-gray-400 pt-3 mt-3">
                        <div className="h-3 bg-blue-600 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-blue-600 text-3xl animate-bounce">↓</div>
                  </div>

                  {/* Step 2: Extracted Data */}
                  <div className="bg-blue-50 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform border border-blue-200">
                    <div className="text-gray-800 space-y-2">
                      <div className="text-xs font-mono text-blue-600">EXTRACTED DATA</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-semibold">Merchant:</div>
                        <div className="text-gray-600">Starbucks</div>
                        <div className="font-semibold">Date:</div>
                        <div className="text-gray-600">2025-10-05</div>
                        <div className="font-semibold">Total:</div>
                        <div className="text-blue-600 font-bold">$24.50</div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-blue-600 text-3xl animate-bounce">↓</div>
                  </div>

                  {/* Step 3: Excel Download */}
                  <div className="bg-green-500 rounded-lg p-6 shadow-md transform hover:scale-105 transition-transform">
                    <div className="text-white text-center space-y-2">
                      <div className="text-2xl">📊</div>
                      <div className="font-semibold">Download Excel</div>
                      <div className="text-sm text-green-100">Ready in seconds</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Accent - Softer colors */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
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
