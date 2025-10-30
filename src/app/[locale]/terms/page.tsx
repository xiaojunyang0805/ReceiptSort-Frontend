import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'termsPage' });

  return {
    title: t('title'),
    description: t('sections.acceptance.content'),
  };
}

export default function TermsOfServicePage() {
  const t = useTranslations('termsPage');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToHome')}
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <div className="prose prose-gray max-w-none space-y-6">
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.acceptance.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.acceptance.content')}
            </p>
          </section>

          {/* 2. Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.description.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.description.content')}
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.userAccounts.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.userAccounts.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.userAccounts.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. Credits */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.credits.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.credits.content')}
            </p>
          </section>

          {/* 5. Use Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.usePolicy.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.usePolicy.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.usePolicy.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.intellectualProperty.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.intellectualProperty.content')}
            </p>
          </section>

          {/* 7. Data Processing */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.dataProcessing.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.dataProcessing.content')}
            </p>
          </section>

          {/* 8. Warranties */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.warranties.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.warranties.content')}
            </p>
          </section>

          {/* 9. Limitation */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.limitation.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.limitation.content')}
            </p>
          </section>

          {/* 10. Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.termination.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.termination.content')}
            </p>
          </section>

          {/* 11. Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.changes.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.changes.content')}
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.governing.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.governing.content')}
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.contact.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.contact.intro')}
            </p>
            <ul className="list-none space-y-2 text-gray-700 ml-4 mt-3">
              <li>{t('sections.contact.email')}</li>
              <li>{t('sections.contact.contactForm')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
