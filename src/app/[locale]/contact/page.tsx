import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/lib/navigation';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';

export default function ContactPage() {
  // Web3Forms access key - get yours at https://web3forms.com
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '';
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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm accessKey={accessKey} />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Us Directly
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">General Support</h3>
                  <a
                    href="mailto:support@receiptsort.com"
                    className="text-primary hover:underline"
                  >
                    support@receiptsort.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Sales Inquiries</h3>
                  <a
                    href="mailto:sales@receiptsort.com"
                    className="text-primary hover:underline"
                  >
                    sales@receiptsort.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Privacy & Legal</h3>
                  <a
                    href="mailto:legal@receiptsort.com"
                    className="text-primary hover:underline"
                  >
                    legal@receiptsort.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Before reaching out, you might find your answer in our FAQ section.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/#faq">
                    View FAQ
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  New to ReceiptSorter? Learn how to get started in 3 simple steps.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/#how-it-works">
                    How It Works
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
