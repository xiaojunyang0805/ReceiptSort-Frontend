import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExcel, generateExcelFilename } from '@/lib/excel-generator'

interface ExportRequest {
  receipt_ids: string[]
}

// Export limits
const MAX_EXPORT_RECEIPTS = 1000

/**
 * POST /api/export/excel
 * Export receipts to Excel format with formatting
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
    const { receipt_ids } = body

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

    console.log(`[Excel Export] User ${user.id} exporting ${receipt_ids.length} receipts`)

    // 3. Fetch receipts from database (with ownership verification)
    // Only fetch fields needed for export to optimize performance
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select('id, processing_status, merchant_name, total_amount, currency, receipt_date, category, tax_amount, payment_method, notes, created_at')
      .in('id', receipt_ids)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('[Excel Export] Failed to fetch receipts:', fetchError)
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

    console.log(`[Excel Export] Found ${completedReceipts.length} completed receipts`)

    // 5. Generate Excel file
    const excelBuffer = await generateExcel(completedReceipts)
    const filename = generateExcelFilename()

    // 6. Record export in exports table
    try {
      console.log('[Excel Export] Attempting to insert export record:', {
        user_id: user.id,
        export_type: 'excel',
        receipt_count: completedReceipts.length,
        file_name: filename,
      })

      const { data: insertData, error: insertError } = await supabase.from('exports').insert({
        user_id: user.id,
        export_type: 'excel',
        receipt_count: completedReceipts.length,
        file_name: filename,
      }).select()

      if (insertError) {
        console.error('[Excel Export] Failed to save export record:', insertError)
        console.error('[Excel Export] Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
        // Log but don't fail the export
      } else {
        console.log('[Excel Export] Successfully saved export record:', insertData)
      }
    } catch (exportLogError) {
      // Don't fail the export if logging fails
      console.error('[Excel Export] Exception while logging export:', exportLogError)
    }

    console.log(`[Excel Export] Successfully generated ${filename} (${excelBuffer.length} bytes)`)

    // 7. Return Excel file with proper headers
    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[Excel Export] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to export receipts to Excel' },
      { status: 500 }
    )
  }
}
