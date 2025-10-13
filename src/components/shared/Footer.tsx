'use client';

import { Link } from '@/lib/navigation';
import { FileText, Mail, Twitter, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('navigation')

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('company')}</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  About
                </button>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">
                  {tNav('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('product')}</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  {tNav('features')}
                </button>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-primary transition-colors">
                  {tNav('pricing')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  {tNav('howItWorks')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  {tNav('faq')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-primary transition-colors">
                  {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Social</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://twitter.com/receiptsort"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/receiptsort"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@receiptsort.com"
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo and Copyright */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">ReceiptSorter</span>
              </Link>
              <span className="text-sm text-gray-500">
                © 2025 ReceiptSorter. {t('allRightsReserved')}.
              </span>
            </div>

            {/* Company Info */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <a
                href="mailto:support@seenano.nl"
                className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                support@seenano.nl
              </a>
              <div className="text-sm text-gray-500">
                Made with ❤️ in the Netherlands
              </div>
              <div className="text-sm text-gray-500">
                Powered by Seenano Technology B.V.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
