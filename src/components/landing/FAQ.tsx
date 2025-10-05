'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How accurate is the AI extraction?',
    answer: "Our AI achieves 95%+ accuracy on clear, standard receipts. You can always manually edit any extracted data before exporting.",
  },
  {
    question: 'What file formats do you support?',
    answer: 'We support all common image formats (JPG, PNG, WebP) and PDF files up to 10MB.',
  },
  {
    question: 'How much does it cost?',
    answer: 'We use a credit system. Each receipt costs 1 credit ($0.50). You can buy credits in packs (10 for $9.99, 50 for $24.99, etc.) or subscribe for better value.',
  },
  {
    question: 'Do credits expire?',
    answer: "No, credits never expire. Use them whenever you need them.",
  },
  {
    question: 'Is my data secure?',
    answer: "Yes. We use bank-level encryption (256-bit SSL), and your receipts are automatically deleted after 90 days. We never share your data.",
  },
  {
    question: 'Can I export to QuickBooks or Xero?',
    answer: 'Currently, we export to Excel and CSV formats which work with all major accounting software. Direct integrations coming soon.',
  },
  {
    question: 'What if the extraction is wrong?',
    answer: "You can manually edit any extracted data before exporting. If extraction completely fails, we'll refund the credit.",
  },
  {
    question: 'Do you offer refunds?',
    answer: "Yes, we offer a 30-day money-back guarantee on credit purchases if you're not satisfied.",
  },
  {
    question: 'Can I use this for my business?',
    answer: 'Absolutely! Many small businesses, freelancers, and accountants use ReceiptSorter for expense tracking and bookkeeping.',
  },
  {
    question: 'Do I need to install any software?',
    answer: 'No, ReceiptSorter is 100% web-based. Access it from any device with a web browser.',
  },
];

function FAQAccordionItem({ faq, isOpen, onClick }: { faq: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onClick}
        className="w-full py-5 px-6 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-indigo-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <p className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about ReceiptSorter
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-16">
          {faqs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* Still Have Questions Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Our support team is here to help. Get in touch and we&apos;ll respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@receiptsort.com"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Email Us
            </a>
            <span className="text-gray-500">or</span>
            <a
              href="#contact"
              className="inline-flex items-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Contact Form
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            support@receiptsort.com
          </p>
        </div>
      </div>
    </section>
  );
}
