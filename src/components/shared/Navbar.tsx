'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <FileText className={`h-6 w-6 transition-colors ${
              isScrolled ? 'text-primary' : 'text-white'
            }`} />
            <span className={`text-xl font-bold transition-colors ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              ReceiptSorter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className={`font-medium transition-colors hover:text-primary ${
                isScrolled ? 'text-gray-600' : 'text-white/90'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className={`font-medium transition-colors hover:text-primary ${
                isScrolled ? 'text-gray-600' : 'text-white/90'
              }`}
            >
              How It Works
            </button>
            <Link
              href="/pricing"
              className={`font-medium transition-colors hover:text-primary ${
                isScrolled ? 'text-gray-600' : 'text-white/90'
              }`}
            >
              Pricing
            </Link>
            <button
              onClick={() => scrollToSection('faq')}
              className={`font-medium transition-colors hover:text-primary ${
                isScrolled ? 'text-gray-600' : 'text-white/90'
              }`}
            >
              FAQ
            </button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className={isScrolled ? 'text-gray-600 hover:text-primary' : 'text-white hover:bg-white/10'}
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className={isScrolled ? '' : 'bg-white text-blue-600 hover:bg-blue-50'}
            >
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${
              isScrolled ? 'text-gray-600' : 'text-white'
            }`}
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
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                How It Works
              </button>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                Pricing
              </Link>
              <button
                onClick={() => scrollToSection('faq')}
                className="px-4 py-2 text-left font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              >
                FAQ
              </button>
              <div className="border-t pt-4 px-4 flex flex-col gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/signup">Start Free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
