import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/lib/navigation';
import { ArrowLeft, MessageSquare, Mail } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { getTranslations } from 'next-intl/server';

export default async function ContactPage() {
  const t = await getTranslations('contact');

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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t('sendMessage')}
              </CardTitle>
              <CardDescription>
                {t('formDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          {/* Email Contact Card */}
          <Card className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('preferEmail')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">
                {t('reachDirectly')}
              </p>
              <a
                href="mailto:support@seenano.nl"
                className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
              >
                <Mail className="h-5 w-5" />
                support@seenano.nl
              </a>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle>{t('frequentlyAskedQuestions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {t('faqDescription')}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/#faq">
                    {t('viewFaq')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle>{t('quickStartGuide')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {t('quickStartDescription')}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/#how-it-works">
                    {t('howItWorks')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
