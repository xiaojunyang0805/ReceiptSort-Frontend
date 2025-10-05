import { Upload, Sparkles, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const steps = [
  {
    number: '1',
    icon: Upload,
    title: 'Upload Your Receipts',
    description: 'Drag and drop receipt photos or PDFs. Works with any device.',
    visual: (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Drop receipts here</p>
        </div>
      </div>
    ),
  },
  {
    number: '2',
    icon: Sparkles,
    title: 'AI Extracts the Data',
    description: 'Our AI reads your receipts and pulls out all the important information in seconds.',
    visual: (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">Processing...</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-medium">Starbucks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium text-green-600">$24.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">Oct 5, 2025</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '3',
    icon: Download,
    title: 'Download Your Spreadsheet',
    description: 'Get a perfectly formatted Excel or CSV file ready for your accounting software.',
    visual: (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 mb-3">
            <Download className="h-5 w-5" />
            <span className="text-sm font-medium">Ready to download</span>
          </div>
          <div className="bg-green-50 rounded p-3 text-xs font-mono">
            <div className="grid grid-cols-3 gap-2 font-semibold border-b pb-1">
              <span>Merchant</span>
              <span>Amount</span>
              <span>Date</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-muted-foreground">
              <span>Starbucks</span>
              <span>$24.50</span>
              <span>10/5/25</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="demo" className="container mx-auto px-4 py-20 bg-muted/30">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Get organized in 3 simple steps
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          From receipt photo to organized spreadsheet in under a minute
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 md:gap-4 relative">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                {/* Connecting Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 -right-4 z-10">
                    <ArrowRight className="h-8 w-8 text-primary" />
                  </div>
                )}

                {/* Step Card */}
                <div className="text-center space-y-4">
                  {/* Number Badge */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-2">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold">{step.title}</h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Visual */}
                  <div className="pt-4">{step.visual}</div>
                </div>

                {/* Mobile Arrow (vertical) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-6">
                    <div className="rotate-90">
                      <ArrowRight className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <Button size="lg" asChild className="text-lg px-8 py-6 h-auto">
          <Link href="/signup">
            Try It Free
            <span className="ml-2">→</span>
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          10 free credits • No credit card required
        </p>
      </div>
    </section>
  )
}
