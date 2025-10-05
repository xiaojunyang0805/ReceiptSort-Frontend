import { Upload, Sparkles, Download, DollarSign, Shield, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Upload,
    title: 'Upload from Any Device',
    description:
      'Drag & drop receipts from your phone, email, or scanner. Supports images and PDFs up to 10MB.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Data Extraction',
    description:
      'GPT-4 Vision extracts merchant, amount, date, category, tax, and payment method with 95%+ accuracy.',
  },
  {
    icon: Download,
    title: 'Export to Excel or CSV',
    description:
      'Download organized spreadsheets ready for QuickBooks, Xero, or any accounting software.',
  },
  {
    icon: DollarSign,
    title: 'No Monthly Commitment',
    description:
      'Only $0.50 per receipt. Buy credits when you need them. Never worry about subscription fees.',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description:
      'Your data is encrypted and never shared. GDPR compliant. Receipts automatically deleted after 90 days.',
  },
  {
    icon: Clock,
    title: 'Save 5+ Hours Weekly',
    description:
      'Stop manual data entry. Process 100 receipts in the time it takes to do 1 manually.',
  },
]

export function Features() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Everything you need to organize receipts
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Powerful features designed to save you time and simplify your receipt management
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
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
