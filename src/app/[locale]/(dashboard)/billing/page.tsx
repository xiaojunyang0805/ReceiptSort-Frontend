/**
 * Billing & Purchase History Page
 *
 * Displays purchase invoices from Stripe for accounting and record-keeping
 * Note: This is for purchase history, not receipt/invoice processing
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, FileText, Calendar } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface Invoice {
  id: string
  stripe_invoice_id: string
  stripe_customer_id: string
  invoice_number: string | null
  amount_due: number
  amount_paid: number
  currency: string
  status: string
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  created_at: string
  paid_at: string | null
  metadata: Record<string, unknown>
}

export default async function BillingPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user's invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (invoicesError) {
    console.error('[Billing] Error fetching invoices:', invoicesError)
  }

  const t = await getTranslations('billing')

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Export Actions */}
      <div className="mb-6 flex gap-4">
        <Button variant="outline" asChild>
          <a href="/api/invoices/export?format=csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/api/invoices/export?format=json">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </a>
        </Button>
      </div>

      {/* Invoices List */}
      {!invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {t('noInvoices')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('noInvoicesDescription')}
            </p>
            <Button asChild>
              <a href="/credits">
                {t('purchaseCredits')}
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice: Invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  )
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amountInCents: number, currency: string) => {
    const amount = amountInCents / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'void':
      case 'uncollectible':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              Invoice {invoice.invoice_number || invoice.stripe_invoice_id.substring(0, 12)}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {formatDate(invoice.created_at)}
              </div>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
            <div className="text-2xl font-bold">
              {formatAmount(invoice.amount_due, invoice.currency)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Package</p>
            <p className="font-medium">
              {(invoice.metadata as { package_id?: string })?.package_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credits</p>
            <p className="font-medium">
              {(invoice.metadata as { credits?: string })?.credits || 'N/A'} credits
            </p>
          </div>
          {invoice.paid_at && (
            <div>
              <p className="text-sm text-muted-foreground">Paid On</p>
              <p className="font-medium">{formatDate(invoice.paid_at)}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {invoice.invoice_pdf && (
            <Button variant="outline" size="sm" asChild>
              <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
          {invoice.hosted_invoice_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Invoice
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
