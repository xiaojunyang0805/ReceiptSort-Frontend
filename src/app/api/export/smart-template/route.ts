import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { TEMPLATE_PRICING } from '@/lib/template-pricing'

interface SmartTemplateExportRequest {
  receipt_ids: string[]
  template_file: string // base64 encoded file
  sheet_name: string
  start_row: number
  field_mapping: Record<string, string>
  save_for_reuse?: boolean
  template_name?: string
  template_description?: string
}

/**
 * POST /api/export/smart-template
 * Export receipts using an uploaded template (AI-analyzed)
 * Charges 20 credits only on successful export
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[Smart Template Export ${requestId}] ========== REQUEST START ==========`)

  try {
    const supabase = await createClient()

    // Verify authentication
    console.log(`[Smart Template Export ${requestId}] Step 1: Authenticating...`)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error(`[Smart Template Export ${requestId}] Auth failed:`, authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Smart Template Export ${requestId}] ✓ Authenticated user:`, user.id)

    console.log(`[Smart Template Export ${requestId}] Step 2: Parsing request body...`)
    const body = await request.json() as SmartTemplateExportRequest
    const { receipt_ids, template_file, sheet_name, start_row, field_mapping, save_for_reuse, template_name, template_description } = body

    console.log(`[Smart Template Export ${requestId}] Request details:`, {
      receiptCount: receipt_ids?.length,
      hasTemplateFile: !!template_file,
      templateFileLength: template_file?.length,
      sheetName: sheet_name,
      startRow: start_row,
      fieldMappingKeys: Object.keys(field_mapping || {}),
      saveForReuse: save_for_reuse,
      templateName: template_name
    })

    if (!receipt_ids || receipt_ids.length === 0) {
      console.error(`[Smart Template Export ${requestId}] ❌ No receipts selected`)
      return NextResponse.json({ error: 'No receipts selected' }, { status: 400 })
    }

    if (!template_file || !field_mapping) {
      console.error(`[Smart Template Export ${requestId}] ❌ Missing template or mapping`)
      return NextResponse.json({ error: 'Template file and mapping required' }, { status: 400 })
    }

    console.log(`[Smart Template Export ${requestId}] Step 3: Fetching receipts...`)

    // Fetch receipts
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .in('id', receipt_ids)
      .eq('processing_status', 'completed')

    if (fetchError) {
      console.error(`[Smart Template Export ${requestId}] ❌ Fetch error:`, fetchError)
      throw new Error(`Failed to fetch receipts: ${fetchError.message}`)
    }

    console.log(`[Smart Template Export ${requestId}] ✓ Found ${receipts?.length || 0} receipts`)

    if (!receipts || receipts.length === 0) {
      console.error(`[Smart Template Export ${requestId}] ❌ No completed receipts`)
      return NextResponse.json({ error: 'No completed receipts found' }, { status: 400 })
    }

    // Check user has enough credits (20 for smart template export)
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < TEMPLATE_PRICING.COST_PER_TEMPLATE) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: TEMPLATE_PRICING.COST_PER_TEMPLATE,
          available: profile?.credits || 0,
        },
        { status: 402 }
      )
    }

    // Decode template file from base64
    const templateBuffer = Buffer.from(template_file, 'base64')

    // Load the template workbook using xlsx library (better WPS Office compatibility)
    const workbook = XLSX.read(templateBuffer, { cellStyles: true })

    console.log(`[Smart Template Export ${requestId}] Loaded template with xlsx library`)
    console.log(`[Smart Template Export ${requestId}] Sheet names:`, workbook.SheetNames)

    const worksheet = workbook.Sheets[sheet_name]
    if (!worksheet) {
      throw new Error(`Sheet "${sheet_name}" not found in template`)
    }

    console.log('[Smart Template Export] Populating template...')

    // Populate the template with receipt data
    receipts.forEach((receipt, index) => {
      const rowNum = start_row + index

      Object.entries(field_mapping).forEach(([field, column]) => {
        const cellAddress = `${column}${rowNum}`

        // Get the value from receipt
        let value: string | number | Date | null = null

        switch (field) {
          case 'invoice_number':
            value = receipt.invoice_number || ''
            break
          case 'merchant_name':
            value = receipt.merchant_name || ''
            break
          case 'receipt_date':
            value = receipt.receipt_date ? new Date(receipt.receipt_date) : ''
            break
          case 'total_amount':
            value = receipt.total_amount || 0
            break
          case 'subtotal':
            value = receipt.subtotal || 0
            break
          case 'tax_amount':
            value = receipt.tax_amount || 0
            break
          case 'currency':
            value = receipt.currency || 'EUR'
            break
          case 'category':
            value = receipt.category || ''
            break
          case 'payment_method':
            value = receipt.payment_method || ''
            break
          case 'vendor_tax_id':
            value = receipt.vendor_tax_id || ''
            break
          case 'vendor_address':
            value = receipt.vendor_address || ''
            break
          default:
            value = ''
        }

        // Set cell value using xlsx format
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = {}
        }

        if (value instanceof Date) {
          worksheet[cellAddress].v = value
          worksheet[cellAddress].t = 'd'
          worksheet[cellAddress].z = 'yyyy-mm-dd'
        } else if (typeof value === 'number') {
          worksheet[cellAddress].v = value
          worksheet[cellAddress].t = 'n'
          if (field.includes('amount') || field === 'subtotal') {
            worksheet[cellAddress].z = '#,##0.00'
          }
        } else {
          worksheet[cellAddress].v = value
          worksheet[cellAddress].t = 's'
        }
      })
    })

    console.log('[Smart Template Export] Generating file...')

    // Generate the Excel file using xlsx library (WPS Office compatible)
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    console.log(`[Smart Template Export ${requestId}] Generated buffer: ${buffer.length} bytes`)

    // CHARGE CREDITS NOW (only after successful generation)
    console.log(`[Smart Template Export ${requestId}] Charging ${TEMPLATE_PRICING.COST_PER_TEMPLATE} credits...`)
    console.log(`[Smart Template Export ${requestId}] Current credits: ${profile.credits}, After: ${profile.credits - TEMPLATE_PRICING.COST_PER_TEMPLATE}`)

    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - TEMPLATE_PRICING.COST_PER_TEMPLATE })
      .eq('id', user.id)

    if (deductError) {
      console.error(`[Smart Template Export ${requestId}] ❌ Failed to deduct credits:`, deductError)
      // Continue anyway since file was generated
    } else {
      console.log(`[Smart Template Export ${requestId}] ✓ Credits deducted successfully`)
    }

    // Record the transaction
    console.log(`[Smart Template Export ${requestId}] Recording transaction...`)
    const { error: txError } = await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -TEMPLATE_PRICING.COST_PER_TEMPLATE,
      transaction_type: 'usage',
      description: `Smart template export: ${receipts.length} receipts`,
    })

    if (txError) {
      console.error(`[Smart Template Export ${requestId}] ❌ Failed to record transaction:`, txError)
    } else {
      console.log(`[Smart Template Export ${requestId}] ✓ Transaction recorded`)
    }

    // If user wants to save for reuse, create template record
    if (save_for_reuse && template_name) {
      console.log('[Smart Template Export] Saving template for reuse...')

      // Upload template file to storage
      const fileName = `${user.id}/templates/${Date.now()}_${template_name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, templateBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: false,
        })

      if (!uploadError) {
        // Create template record
        const { error: insertError } = await supabase.from('export_templates').insert({
          user_id: user.id,
          template_name: template_name,
          description: template_description || null,
          file_path: fileName,
          sheet_name: sheet_name,
          start_row: start_row,
          field_mapping: field_mapping,
          credits_spent: 0, // No additional charge since already charged for export
        })

        if (insertError) {
          console.error('[Smart Template Export] Failed to save template:', insertError)
        } else {
          console.log('[Smart Template Export] Template saved for reuse')
        }
      } else {
        console.error('[Smart Template Export] Failed to upload template file:', uploadError)
      }
    }

    // Return the file
    const filename = `receipts_export_${new Date().toISOString().split('T')[0]}.xlsx`

    console.log(`[Smart Template Export ${requestId}] ========== RETURNING FILE ==========`)
    console.log(`[Smart Template Export ${requestId}] Filename: ${filename}`)
    console.log(`[Smart Template Export ${requestId}] Buffer type: ${buffer.constructor.name}`)
    console.log(`[Smart Template Export ${requestId}] Buffer length: ${buffer.length}`)

    // Return buffer with proper type casting (same as Excel export route)
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[Smart Template Export] Error:', error)
    return NextResponse.json(
      {
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
