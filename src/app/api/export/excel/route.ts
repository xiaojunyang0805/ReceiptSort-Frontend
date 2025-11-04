import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExcel, generateExcelFilename } from '@/lib/excel-generator'

interface ExportRequest {
  receipt_ids: string[]
  locale?: string
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
    const { receipt_ids, locale = 'en' } = body

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
    // Fetch all fields needed for export (Phase 1 + Phase 2 + Phase 3)
    const { data: receipts, error: fetchError} = await supabase
      .from('receipts')
      .select(`
        id, processing_status, merchant_name, total_amount, currency, receipt_date, category, tax_amount, payment_method, notes, created_at,
        invoice_number, document_type, subtotal, vendor_address, due_date,
        purchase_order_number, payment_reference, vendor_tax_id,
        patient_dob, treatment_date, insurance_claim_number, diagnosis_codes, procedure_codes, provider_id,
        insurance_covered_amount, patient_responsibility_amount
      `)
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

    // 5. Generate Excel file with translated headers
    const excelBuffer = await generateExcel(completedReceipts, locale)
    const filename = generateExcelFilename()

    // 6. Upload file to Supabase Storage
    const filePath = `${user.id}/exports/${filename}`
    let fileUrl = ''

    try {
      console.log('[Excel Export] Uploading to Storage:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, excelBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('[Excel Export] Upload failed:', uploadError)
        // Continue even if upload fails - still return file to user
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
        console.log('[Excel Export] File uploaded successfully:', fileUrl)
      }
    } catch (storageError) {
      console.error('[Excel Export] Storage error:', storageError)
    }

    // 7. Record export in exports table
    try {
      const exportRecord = {
        user_id: user.id,
        export_type: 'excel' as const,
        receipt_count: completedReceipts.length,
        file_name: filename,
        file_path: filePath,
        file_url: fileUrl || null,
      }

      console.log('[Excel Export] Recording export in database')

      const { error: insertError } = await supabase
        .from('exports')
        .insert(exportRecord)

      if (insertError) {
        console.error('[Excel Export] Failed to record export:', insertError)
      } else {
        console.log('[Excel Export] Export recorded successfully')
      }
    } catch (exportLogError) {
      console.error('[Excel Export] Exception recording export:', exportLogError)
    }

    console.log(`[Excel Export] Successfully generated ${filename} (${excelBuffer.length} bytes)`)

    // 8. Return Excel file with proper headers
    // Add debug header to check if export was logged (for debugging only)
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString(),
      'Cache-Control': 'no-cache',
    }

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('[Excel Export] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to export receipts to Excel' },
      { status: 500 }
    )
  }
}
