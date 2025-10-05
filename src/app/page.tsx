import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'

export default async function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-bold">ReceiptSort</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* How It Works */}
      <section id="demo" className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sign up and get free credits</h3>
                <p className="text-muted-foreground">
                  Create your account and receive 10 free credits to get started
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Upload your receipts</h3>
                <p className="text-muted-foreground">
                  Drag and drop receipt images or PDFs, or click to browse your files
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI processes your receipts</h3>
                <p className="text-muted-foreground">
                  Our AI extracts merchant, date, amount, and other key details automatically
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Export and organize</h3>
                <p className="text-muted-foreground">
                  Download your organized receipts in your preferred format
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to get organized?</CardTitle>
            <CardDescription>
              Start managing your receipts smarter, not harder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild>
              <Link href="/signup">Sign Up Now</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="flex justify-center items-center text-sm text-muted-foreground">
          <p>&copy; 2025 ReceiptSort. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
