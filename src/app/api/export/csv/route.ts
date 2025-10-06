import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCSV, generateCSVFilename } from '@/lib/csv-generator'
import { getTemplate, createCustomTemplate } from '@/lib/export-templates'

interface ExportRequest {
  receipt_ids: string[]
  template_id?: string
  custom_columns?: string[]
}

// Export limits
const MAX_EXPORT_RECEIPTS = 1000
// const EXPORT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds (for future caching)

/**
 * POST /api/export/csv
 * Export receipts to CSV format
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body: ExportRequest = await request.json()
    const { receipt_ids, template_id, custom_columns } = body

    if (!receipt_ids || !Array.isArray(receipt_ids) || receipt_ids.length === 0) {
      return NextResponse.json(
        { error: 'No receipt IDs provided' },
        { status: 400 }
      )
    }

    // Check export limit
    if (receipt_ids.length > MAX_EXPORT_RECEIPTS) {
      return NextResponse.json(
        {
          error: `Export limit exceeded. Maximum ${MAX_EXPORT_RECEIPTS} receipts per export.`,
          max_receipts: MAX_EXPORT_RECEIPTS,
          requested: receipt_ids.length,
        },
        { status: 400 }
      )
    }

    console.log(`[CSV Export] User ${user.id} exporting ${receipt_ids.length} receipts`)

    // 3. Fetch receipts from database (with ownership verification)
    // Only fetch fields needed for export to optimize performance
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select('id, processing_status, merchant_name, total_amount, currency, receipt_date, category, tax_amount, payment_method, notes, created_at')
      .in('id', receipt_ids)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('[CSV Export] Failed to fetch receipts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch receipts' },
        { status: 500 }
      )
    }

    if (!receipts || receipts.length === 0) {
      return NextResponse.json(
        { error: 'No receipts found or you do not own these receipts' },
        { status: 404 }
      )
    }

    // 4. Filter only completed receipts
    const completedReceipts = receipts.filter(r => r.processing_status === 'completed')

    if (completedReceipts.length === 0) {
      return NextResponse.json(
        { error: 'No completed receipts found. Please process receipts before exporting.' },
        { status: 400 }
      )
    }

    console.log(`[CSV Export] Found ${completedReceipts.length} completed receipts`)

    // 5. Determine export template
    let template
    if (template_id === 'custom' && custom_columns) {
      template = createCustomTemplate(custom_columns)
    } else if (template_id) {
      template = getTemplate(template_id)
    }
    // If no template or template not found, use default (STANDARD_TEMPLATE)

    console.log(`[CSV Export] Using template: ${template?.name || 'Standard'}`)

    // 6. Generate CSV
    const csv = generateCSV(completedReceipts, template)
    const filename = generateCSVFilename()

    // 7. Record export in exports table
    try {
      const { error: insertError } = await supabase.from('exports').insert({
        user_id: user.id,
        export_type: 'csv',
        receipt_count: completedReceipts.length,
        file_name: filename,
      })

      if (insertError) {
        console.error('[CSV Export] Failed to save export record:', insertError)
        console.error('[CSV Export] Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
      } else {
        console.log('[CSV Export] Successfully saved export record')
      }
    } catch (exportLogError) {
      // Don't fail the export if logging fails
      console.error('[CSV Export] Exception while logging export:', exportLogError)
    }

    console.log(`[CSV Export] Successfully generated ${filename}`)

    // 8. Return CSV file with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[CSV Export] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to export receipts' },
      { status: 500 }
    )
  }
}
