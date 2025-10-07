import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 6, 2025</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using ReceiptSorter (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              ReceiptSorter is a cloud-based receipt processing service that uses artificial intelligence to extract data
              from receipt images and PDFs. The Service allows you to upload receipts, extract merchant information, amounts,
              dates, and other data, and export the results to Excel or CSV formats.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use the Service, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Create an account with accurate information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years old</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activity under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Credits and Pricing</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The Service operates on a credit-based system:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>One credit is required to process one receipt</li>
              <li>Credits never expire</li>
              <li>New users receive 10 free credits</li>
              <li>Additional credits can be purchased through our pricing plans</li>
              <li>All prices are in USD unless otherwise stated</li>
              <li>Prices are subject to change with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We offer a 30-day money-back guarantee for credit purchases. If you are not satisfied with the Service,
              contact us within 30 days for a full refund. Credits used for processing will be deducted from the refund amount.
              Refunds for failed extractions are evaluated on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Upload illegal, fraudulent, or stolen receipts</li>
              <li>Violate any laws or regulations</li>
              <li>Attempt to hack, disrupt, or reverse-engineer the Service</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Resell or redistribute the Service without permission</li>
              <li>Use automated bots or scrapers without authorization</li>
              <li>Upload receipts containing sensitive personal data of others without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of your uploaded receipts and extracted data. ReceiptSorter retains ownership of the
              Service, software, algorithms, and branding. You grant us a limited license to process your receipts to provide
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data Processing and AI</h2>
            <p className="text-gray-700 leading-relaxed">
              We use OpenAI&apos;s GPT-4 Vision API to process receipts. By using the Service, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>AI extraction may not be 100% accurate</li>
              <li>You should review extracted data before use</li>
              <li>Receipt images may be sent to third-party AI providers</li>
              <li>We cannot guarantee specific accuracy rates for all receipts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Data Retention and Deletion</h2>
            <p className="text-gray-700 leading-relaxed">
              Receipt files are automatically deleted from our servers after 90 days. Extracted data is retained until you
              delete it or close your account. You can request full data deletion at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive for 99.9% uptime but cannot guarantee uninterrupted service. We may perform maintenance, updates,
              or experience outages. We are not liable for service interruptions or data loss. We recommend keeping backups
              of important receipts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RECEIPTSORT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION. OUR TOTAL
              LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE LAST 12 MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your account if you violate these Terms. You may close your account at any time.
              Upon termination, your access will end, and data will be deleted according to our retention policy. Unused
              credits are non-refundable upon voluntary account closure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes via email or through the
              Service. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the Netherlands. Any disputes shall be resolved in the courts of
              the Netherlands.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, contact us at:
            </p>
            <ul className="list-none space-y-2 text-gray-700 ml-4 mt-3">
              <li>Email: legal@receiptsort.com</li>
              <li>Contact Form: <Link href="/contact" className="text-primary hover:underline">receiptsort.com/contact</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
