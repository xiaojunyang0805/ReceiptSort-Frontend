'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FAQItem {
  id: string;
}

function FAQAccordionItem({ faq, isOpen, onClick, t }: { faq: FAQItem; isOpen: boolean; onClick: () => void; t: (key: string) => string }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onClick}
        className="w-full py-5 px-6 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900 pr-8">{t(`items.${faq.id}.question`)}</span>
        <ChevronDown
          className={`w-5 h-5 text-indigo-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[600px]' : 'max-h-0'
        }`}
      >
        <div className={`px-6 pb-5 text-gray-600 leading-relaxed whitespace-pre-line ${faq.id === 'customTemplates' ? 'bg-blue-50/50 rounded-b-lg' : ''}`}>
          {t(`items.${faq.id}.answer`)}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations('faq');
  const tSupport = useTranslations('support');

  const faqs: FAQItem[] = [
    { id: 'customTemplates' },
    { id: 'accuracy' },
    { id: 'formats' },
    { id: 'cost' },
    { id: 'expiration' },
    { id: 'security' },
    { id: 'export' },
    { id: 'wrongExtraction' },
    { id: 'refunds' },
    { id: 'business' },
    { id: 'software' },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-16">
          {faqs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              t={t}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* Still Have Questions Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {tSupport('title')}
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            {tSupport('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@seenano.nl"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {tSupport('emailUs')}
            </a>
            <span className="text-gray-500">{tSupport('or')}</span>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {tSupport('contactForm')}
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            support@seenano.nl
          </p>
        </div>
      </div>
    </section>
  );
}
