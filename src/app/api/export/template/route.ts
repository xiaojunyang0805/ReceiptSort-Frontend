import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTemplateExport, generateTemplateExportFilename } from '@/lib/template-generator'

interface ExportRequest {
  receipt_ids: string[]
  template_id: string
}

// Export limits
const MAX_EXPORT_RECEIPTS = 1000

/**
 * POST /api/export/template
 * Export receipts using a custom template
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Fetches user's template configuration
 * 3. Fetches receipts from database
 * 4. Generates Excel file using template
 * 5. Uploads to storage (optional)
 * 6. Returns file to user
 *
 * Note: Exporting with template is FREE (no credit charge)
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
    const { receipt_ids, template_id } = body

    if (!receipt_ids || !Array.isArray(receipt_ids) || receipt_ids.length === 0) {
      return NextResponse.json(
        { error: 'No receipt IDs provided' },
        { status: 400 }
      )
    }

    if (!template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
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

    console.log(
      `[Template Export] User ${user.id} exporting ${receipt_ids.length} receipts with template ${template_id}`
    )

    // 3. Fetch template
    const { data: template, error: templateError } = await supabase
      .from('export_templates')
      .select('*')
      .eq('id', template_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    console.log(`[Template Export] Using template: ${template.template_name}`)

    // 4. Fetch receipts from database
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select(`
        id, processing_status, merchant_name, total_amount, currency, receipt_date, category, tax_amount, payment_method, notes, created_at,
        invoice_number, document_type, subtotal, vendor_address, due_date,
        purchase_order_number, payment_reference, vendor_tax_id
      `)
      .in('id', receipt_ids)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('[Template Export] Failed to fetch receipts:', fetchError)
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

    // 5. Filter only completed receipts
    const completedReceipts = receipts.filter(r => r.processing_status === 'completed')

    if (completedReceipts.length === 0) {
      return NextResponse.json(
        { error: 'No completed receipts found. Please process receipts before exporting.' },
        { status: 400 }
      )
    }

    console.log(`[Template Export] Found ${completedReceipts.length} completed receipts`)

    // 6. Generate Excel file using template
    const excelBuffer = await generateTemplateExport(completedReceipts, {
      filePath: template.file_path,
      sheetName: template.sheet_name,
      startRow: template.start_row,
      fieldMapping: template.field_mapping as Record<string, string>,
    })

    const filename = generateTemplateExportFilename(template.template_name)

    // 7. Update template usage stats
    await supabase
      .from('export_templates')
      .update({
        export_count: template.export_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', template_id)

    // 8. Optionally upload to storage for export history
    const exportFilePath = `${user.id}/exports/${filename}`
    let fileUrl = ''

    try {
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(exportFilePath, excelBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          cacheControl: '3600',
          upsert: false,
        })

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('receipts').getPublicUrl(exportFilePath)

        fileUrl = publicUrl
      }
    } catch (storageError) {
      console.error('[Template Export] Storage error:', storageError)
      // Non-critical, continue
    }

    // 9. Record export in exports table
    try {
      await supabase.from('exports').insert({
        user_id: user.id,
        export_type: 'excel',
        receipt_count: completedReceipts.length,
        file_name: filename,
        file_path: exportFilePath,
        file_url: fileUrl || null,
      })
    } catch (exportLogError) {
      console.error('[Template Export] Failed to log export:', exportLogError)
      // Non-critical, continue
    }

    console.log(`[Template Export] Successfully generated ${filename} (${excelBuffer.length} bytes)`)

    // 10. Return Excel file
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
    console.error('[Template Export] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to export receipts with template' },
      { status: 500 }
    )
  }
}
