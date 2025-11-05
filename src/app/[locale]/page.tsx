import { Hero } from '@/components/landing/Hero'
import { WhatMakesUsDifferent } from '@/components/landing/WhatMakesUsDifferent'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { UseCases } from '@/components/landing/UseCases'
import { SocialProof } from '@/components/landing/SocialProof'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' })

  return {
    title: 'ReceiptSort - AI That Adapts to Your Spreadsheet Format | Smart Receipt Scanner',
    description: 'The only receipt scanner with intelligent template mapping. AI exports to YOUR format automatically—not ours. Works with receipts, invoices, medical notes. $0.20-0.50 per document, no subscription. Try free!',
  }
}

export default async function HomePage() {
  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ReceiptSort',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Receipt Scanner, Invoice Scanner, Expense Tracking',
    operatingSystem: 'Web Browser',
    description: 'Smart receipt scanning with intelligent template mapping. AI exports to YOUR format automatically—not ours. Works with receipts, invoices, and medical notes.',
    offers: {
      '@type': 'Offer',
      price: '0.20',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '0.20-0.50',
        priceCurrency: 'USD',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitText: 'document'
        }
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'Intelligent AI template mapping',
      'Custom export format creation',
      'Multi-document support (receipts, invoices, medical notes)',
      'Pay-per-document pricing',
      'Credits never expire',
      '10 free custom templates',
      '95%+ extraction accuracy',
      'GDPR compliant',
      'Bank-level security'
    ],
    screenshot: 'https://receiptsort.vercel.app/og-image.jpg',
    softwareVersion: '1.0',
    author: {
      '@type': 'Organization',
      name: 'ReceiptSorter'
    }
  };

  return (
    <div className="min-h-screen">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* What Makes Us Different Section - immediately after hero */}
      <WhatMakesUsDifferent />

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* Use Cases Section - after How It Works */}
      <UseCases />

      {/* Social Proof */}
      <SocialProof />

      {/* FAQ Section */}
      <div id="faq">
        <FAQ />
      </div>

      {/* Final CTA Section */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  )
}
