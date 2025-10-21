import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'
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
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as SmartTemplateExportRequest
    const { receipt_ids, template_file, sheet_name, start_row, field_mapping, save_for_reuse, template_name, template_description } = body

    if (!receipt_ids || receipt_ids.length === 0) {
      return NextResponse.json({ error: 'No receipts selected' }, { status: 400 })
    }

    if (!template_file || !field_mapping) {
      return NextResponse.json({ error: 'Template file and mapping required' }, { status: 400 })
    }

    console.log('[Smart Template Export] Processing:', {
      receiptCount: receipt_ids.length,
      sheetName: sheet_name,
      startRow: start_row,
      mappings: Object.keys(field_mapping).length,
    })

    // Fetch receipts
    const { data: receipts, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .in('id', receipt_ids)
      .eq('status', 'completed')

    if (fetchError) {
      throw new Error(`Failed to fetch receipts: ${fetchError.message}`)
    }

    if (!receipts || receipts.length === 0) {
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
    const arrayBuffer = templateBuffer.buffer.slice(
      templateBuffer.byteOffset,
      templateBuffer.byteOffset + templateBuffer.byteLength
    )

    // Load the template workbook
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.getWorksheet(sheet_name)
    if (!worksheet) {
      throw new Error(`Sheet "${sheet_name}" not found in template`)
    }

    console.log('[Smart Template Export] Populating template...')

    // Populate the template with receipt data
    receipts.forEach((receipt, index) => {
      const rowNum = start_row + index

      Object.entries(field_mapping).forEach(([field, column]) => {
        const cellAddress = `${column}${rowNum}`
        const cell = worksheet.getCell(cellAddress)

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

        // Set the cell value
        cell.value = value

        // Apply formatting for specific fields
        if (field === 'receipt_date' && value instanceof Date) {
          cell.numFmt = 'yyyy-mm-dd'
        } else if (field.includes('amount') || field === 'subtotal') {
          cell.numFmt = '#,##0.00'
        }
      })
    })

    console.log('[Smart Template Export] Generating file...')

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // CHARGE CREDITS NOW (only after successful generation)
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - TEMPLATE_PRICING.COST_PER_TEMPLATE })
      .eq('id', user.id)

    if (deductError) {
      console.error('[Smart Template Export] Failed to deduct credits:', deductError)
      // Continue anyway since file was generated
    }

    // Record the transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -TEMPLATE_PRICING.COST_PER_TEMPLATE,
      transaction_type: 'usage',
      description: `Smart template export: ${receipts.length} receipts`,
    })

    console.log('[Smart Template Export] Credits charged:', TEMPLATE_PRICING.COST_PER_TEMPLATE)

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
        await supabase.from('export_templates').insert({
          user_id: user.id,
          template_name: template_name,
          description: template_description || null,
          file_path: fileName,
          sheet_name: sheet_name,
          start_row: start_row,
          field_mapping: field_mapping,
          credits_spent: 0, // No additional charge since already charged for export
        })

        console.log('[Smart Template Export] Template saved for reuse')
      }
    }

    // Return the file
    const filename = `receipts_export_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
