import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
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
    title: 'ReceiptSorter - AI Receipt Data Extraction to Excel | Save Hours on Bookkeeping',
    description: t('subheadline'),
  }
}

export default async function HomePage() {
  // Structured Data (JSON-LD) for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ReceiptSorter',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'AI-powered receipt data extraction service that converts receipt photos into organized Excel spreadsheets.',
    offers: {
      '@type': 'Offer',
      price: '0.50',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '0.50',
        priceCurrency: 'USD',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: '1',
          unitText: 'receipt'
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
      'AI-powered data extraction',
      'Export to Excel and CSV',
      'QuickBooks and Xero compatible',
      '95%+ accuracy rate',
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

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

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
