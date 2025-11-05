import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCSV, generateCSVFilename } from '@/lib/csv-generator'
import { getTranslatedTemplate, createTranslatedCustomTemplate } from '@/lib/export-templates'

interface ExportRequest {
  receipt_ids: string[]
  locale?: string
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
    const { receipt_ids, locale = 'en', template_id, custom_columns } = body

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

    console.log(`[CSV Export] User ${user.id} exporting ${receipt_ids.length} receipts with locale: ${locale}`)

    // 3. Fetch receipts from database (with ownership verification)
    // Fetch all fields needed for export (Phase 1 + Phase 2 + Phase 3)
    const { data: receipts, error: fetchError } = await supabase
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

    // 5. Determine export template with translations
    let template
    if (template_id === 'custom' && custom_columns) {
      template = await createTranslatedCustomTemplate(custom_columns, locale)
    } else if (template_id) {
      template = await getTranslatedTemplate(template_id, locale)
    } else {
      // Default to standard template with translations
      template = await getTranslatedTemplate('standard', locale)
    }

    console.log(`[CSV Export] Using template: ${template.name} (locale: ${locale})`)

    // 6. Generate CSV with translated headers
    const csv = generateCSV(completedReceipts, template)
    const filename = generateCSVFilename()

    // 7. Upload file to Supabase Storage
    const filePath = `${user.id}/exports/${filename}`
    let fileUrl = ''

    try {
      console.log('[CSV Export] Uploading to Storage:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, csv, {
          contentType: 'text/csv; charset=utf-8',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('[CSV Export] Upload failed:', uploadError)
        // Continue even if upload fails - still return file to user
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
        console.log('[CSV Export] File uploaded successfully:', fileUrl)
      }
    } catch (storageError) {
      console.error('[CSV Export] Storage error:', storageError)
    }

    // 8. Record export in exports table
    try {
      const exportRecord = {
        user_id: user.id,
        export_type: 'csv' as const,
        receipt_count: completedReceipts.length,
        file_name: filename,
        file_path: filePath,
        file_url: fileUrl || null,
      }

      console.log('[CSV Export] Recording export in database')

      const { error: insertError } = await supabase
        .from('exports')
        .insert(exportRecord)

      if (insertError) {
        console.error('[CSV Export] Failed to record export:', insertError)
      } else {
        console.log('[CSV Export] Export recorded successfully')
      }
    } catch (exportLogError) {
      console.error('[CSV Export] Exception recording export:', exportLogError)
    }

    console.log(`[CSV Export] Successfully generated ${filename}`)

    // 9. Return CSV file with proper headers
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
