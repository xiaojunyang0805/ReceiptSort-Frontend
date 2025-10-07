import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 6, 2025</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to ReceiptSorter (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your
              personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our receipt processing service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect information that you provide directly to us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Account information (email address, name)</li>
              <li>Receipt images and PDFs that you upload</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide and maintain our receipt processing service</li>
              <li>Process your receipts using AI technology</li>
              <li>Process payments and manage your account</li>
              <li>Send you service updates and promotional communications</li>
              <li>Improve our services and develop new features</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>256-bit SSL encryption for data transmission</li>
              <li>Secure cloud storage with access controls</li>
              <li>Automatic deletion of receipt files after 90 days</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Service providers (OpenAI for receipt processing, Stripe for payments)</li>
              <li>Law enforcement when required by law</li>
              <li>Business partners with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under GDPR and other privacy laws, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies to provide our service and optional analytics cookies to improve user experience.
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data only as long as necessary to provide our services and comply with legal obligations.
              Receipt files are automatically deleted after 90 days. Account data is retained until you request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for children under 18. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none space-y-2 text-gray-700 ml-4 mt-3">
              <li>Email: privacy@receiptsort.com</li>
              <li>Contact Form: <Link href="/contact" className="text-primary hover:underline">receiptsort.com/contact</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
