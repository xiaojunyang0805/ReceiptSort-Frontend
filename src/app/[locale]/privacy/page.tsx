import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });

  return {
    title: t('title'),
    description: t('sections.introduction.content'),
  };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacyPage');

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
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.introduction.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.introduction.content')}
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.informationWeCollect.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.informationWeCollect.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.informationWeCollect.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.howWeUse.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.howWeUse.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.howWeUse.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.dataSecurity.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.dataSecurity.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.dataSecurity.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 5. Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.dataSharing.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.dataSharing.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.dataSharing.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.yourRights.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('sections.yourRights.intro')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              {t.raw('sections.yourRights.items').map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 7. Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.cookies.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.cookies.content')}
            </p>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.dataRetention.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.dataRetention.content')}
            </p>
          </section>

          {/* 9. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.childrensPrivacy.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.childrensPrivacy.content')}
            </p>
          </section>

          {/* 10. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('sections.changes.title')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('sections.changes.content')}
            </p>
          </section>

          {/* 11. Contact Us */}
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
