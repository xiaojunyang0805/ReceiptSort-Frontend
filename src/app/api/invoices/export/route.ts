/**
 * Invoice Export API
 *
 * Exports invoices in CSV or JSON format for VAT filing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

/**
 * GET /api/invoices/export
 * Export invoices in CSV or JSON format
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    console.log(`[Invoice Export] User ${user.id} exporting as ${format}`)

    // 3. Build query
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // 4. Fetch invoices
    const { data: invoices, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch invoices: ${fetchError.message}`)
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: 'No invoices found' },
        { status: 404 }
      )
    }

    console.log(`[Invoice Export] Found ${invoices.length} invoices`)

    // 5. Export based on format
    if (format === 'json') {
      return NextResponse.json(invoices, {
        headers: {
          'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    } else {
      // CSV format
      const csv = convertToCSV(invoices as Invoice[])

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('[Invoice Export] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to export invoices'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Convert invoices to CSV format
 */
function convertToCSV(invoices: Invoice[]): string {
  // CSV Headers
  const headers = [
    'Invoice Number',
    'Invoice ID',
    'Date',
    'Paid Date',
    'Amount Due',
    'Amount Paid',
    'Currency',
    'Status',
    'Package',
    'Credits',
    'Invoice PDF',
    'Hosted URL',
  ]

  // CSV Rows
  const rows = invoices.map(invoice => {
    const metadata = invoice.metadata as { package_id?: string; credits?: string }

    return [
      invoice.invoice_number || invoice.stripe_invoice_id,
      invoice.stripe_invoice_id,
      new Date(invoice.created_at).toISOString().split('T')[0],
      invoice.paid_at ? new Date(invoice.paid_at).toISOString().split('T')[0] : '',
      (invoice.amount_due / 100).toFixed(2),
      (invoice.amount_paid / 100).toFixed(2),
      invoice.currency.toUpperCase(),
      invoice.status,
      metadata?.package_id || '',
      metadata?.credits || '',
      invoice.invoice_pdf || '',
      invoice.hosted_invoice_url || '',
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escape commas and quotes in cell content
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ),
  ].join('\n')

  return csvContent
}
