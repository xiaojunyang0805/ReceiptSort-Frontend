import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Download, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">ReceiptSort</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Organize Your Receipts with AI
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload, process, and export your receipts effortlessly. Let AI do the heavy lifting
            while you focus on what matters.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Easy Upload</CardTitle>
              <CardDescription>
                Drag and drop your receipt images or PDFs. Upload multiple files at once.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Processing</CardTitle>
              <CardDescription>
                Our AI extracts key information from your receipts automatically and accurately.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Export Anywhere</CardTitle>
              <CardDescription>
                Export your processed receipts to Excel, CSV, or JSON format with one click.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
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
