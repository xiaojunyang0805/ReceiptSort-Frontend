import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'ReceiptSort - AI That Adapts to Your Spreadsheet Format | Smart Receipt Scanner',
  description: 'The only receipt scanner with intelligent template mapping. AI exports to YOUR format automatically—not ours. Works with receipts, invoices, medical notes. $0.20-0.50 per document, no subscription. Try free!',
  keywords: 'receipt scanner, custom templates, receipt OCR, receipt to excel, expense tracking, AI template mapping, pay per receipt, invoice scanner, medical receipt scanner',
  authors: [{ name: 'ReceiptSorter' }],
  creator: 'ReceiptSorter',
  publisher: 'ReceiptSorter',
  robots: 'index, follow',
  metadataBase: new URL('https://receiptsort.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://receiptsort.vercel.app',
    siteName: 'ReceiptSort',
    title: 'ReceiptSort - AI That Adapts to Your Spreadsheet Format',
    description: 'The only receipt scanner with intelligent template mapping. AI exports to YOUR format automatically. $0.20-0.50 per document, no subscription.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ReceiptSorter AI Receipt Scanner',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@receiptsort',
    creator: '@receiptsort',
    title: 'ReceiptSort - AI That Adapts to Your Format',
    description: 'The only scanner with intelligent template mapping. AI adapts to YOUR spreadsheet format. $0.20-0.50 per document.',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://receiptsort.vercel.app',
  },
  category: 'Business & Productivity',
};
