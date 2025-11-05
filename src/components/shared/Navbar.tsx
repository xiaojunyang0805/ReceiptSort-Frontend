'use client';

import { useState, useEffect } from 'react';
import { FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations('navigation');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md'
          : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FileText className="h-6 w-6 text-primary transition-colors" />
            <span className="text-xl font-bold text-gray-900 transition-colors">
              ReceiptSorter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {t('features')}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {t('howItWorks')}
            </button>
            <Link
              href="/pricing"
              className="font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {t('pricing')}
            </Link>
            <button
              onClick={() => scrollToSection('faq')}
              className="font-medium text-gray-600 transition-colors hover:text-primary"
            >
              {t('faq')}
            </button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              asChild
              variant="ghost"
              className="text-gray-600 hover:text-primary"
            >
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button
              asChild
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/signup">{t('signup')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="flex flex-col py-4 space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                {t('features')}
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                {t('howItWorks')}
              </button>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                {t('pricing')}
              </Link>
              <button
                onClick={() => scrollToSection('faq')}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                {t('faq')}
              </button>
              <div className="border-t pt-4 px-4 flex flex-col gap-3">
                <LanguageSwitcher />
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <Button
                  asChild
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/signup">{t('signup')}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
