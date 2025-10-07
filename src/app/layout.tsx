import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'ReceiptSorter - AI Receipt Data Extraction to Excel | Save Hours on Bookkeeping',
  description: 'Extract data from receipts automatically with AI. Upload receipt photos, get organized Excel files. Perfect for small businesses, freelancers, and accountants. Try free!',
  keywords: 'receipt scanner, receipt OCR, receipt to excel, expense tracking, invoice data extraction, AI receipt processing, bookkeeping automation, accounting software',
  authors: [{ name: 'ReceiptSorter' }],
  creator: 'ReceiptSorter',
  publisher: 'ReceiptSorter',
  robots: 'index, follow',
  metadataBase: new URL('https://receiptsort.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://receiptsort.vercel.app',
    siteName: 'ReceiptSorter',
    title: 'ReceiptSorter - AI Receipt Data Extraction',
    description: 'Turn receipt photos into organized Excel spreadsheets. AI-powered, 95%+ accuracy, $0.50 per receipt.',
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
    title: 'ReceiptSorter - AI Receipt Data Extraction',
    description: 'Turn receipt photos into Excel. Save 5+ hours weekly.',
    images: ['/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://receiptsort.vercel.app',
  },
  category: 'Business & Productivity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
