import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractReceiptDataWithVision } from '@/lib/openai'

// Configure route segment for Vercel dynamic API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30 // Allow time for Vision API processing

/**
 * Upload converted PNG and process it
 *
 * This endpoint accepts a PNG file that was converted from a PDF in the browser.
 * It does NOT do any PDF conversion - the client has already done that.
 *
 * Workflow:
 * 1. Client converts PDF → PNG in browser using PDF.js
 * 2. Client sends PNG file to this endpoint
 * 3. Server uploads PNG to storage
 * 4. Server creates new receipt record (or updates existing)
 * 5. Server processes PNG with Vision API
 * 6. Returns high-confidence result (~95%)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`[Upload Converted] Starting upload for receipt ${params.id}`)

  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[Upload Converted] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Upload Converted] User authenticated: ${user.id}`)

    // 2. Verify original receipt exists and user owns it
    const { data: originalReceipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (receiptError || !originalReceipt) {
      console.log(`[Upload Converted] Receipt not found: ${params.id}`)
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    console.log(`[Upload Converted] Original receipt found: ${originalReceipt.file_name}`)

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('[Upload Converted] No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 4. Verify it's an image
    if (!file.type.startsWith('image/')) {
      console.log(`[Upload Converted] Invalid file type: ${file.type}`)
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    console.log(`[Upload Converted] File received: ${file.name} (${file.type}, ${file.size} bytes)`)

    // 5. Upload PNG to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}-converted-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log(`[Upload Converted] Uploading to storage: ${filePath}`)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Upload Converted] Upload error:', uploadError)
      throw uploadError
    }

    // 6. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('receipts').getPublicUrl(filePath)

    console.log(`[Upload Converted] File uploaded successfully: ${publicUrl}`)

    // 7. Create new receipt record for the converted PNG
    const { data: newReceipt, error: dbError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'processing', // Will be processed immediately
      })
      .select()
      .single()

    if (dbError || !newReceipt) {
      console.error('[Upload Converted] Database error:', dbError)
      throw dbError || new Error('Failed to create receipt record')
    }

    console.log(`[Upload Converted] New receipt created: ${newReceipt.id}`)

    // 8. Process the PNG with Vision API
    console.log(`[Upload Converted] Processing PNG with Vision API`)

    const extractedData = await extractReceiptDataWithVision(publicUrl)

    console.log(
      `[Upload Converted] Vision API extraction complete. Confidence: ${(extractedData.confidence_score * 100).toFixed(0)}%`
    )

    // 9. Update receipt with extracted data
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        processing_status: 'completed',
        merchant_name: extractedData.merchant_name,
        total_amount: extractedData.amount,
        currency: extractedData.currency,
        receipt_date: extractedData.receipt_date,
        category: extractedData.category,
        tax_amount: extractedData.tax_amount,
        payment_method: extractedData.payment_method,
        confidence_score: extractedData.confidence_score,
        raw_ocr_text: extractedData.raw_text,
        // Phase 1 fields
        invoice_number: extractedData.invoice_number,
        document_type: extractedData.document_type,
        subtotal: extractedData.subtotal,
        vendor_address: extractedData.vendor_address,
        due_date: extractedData.due_date,
        // Phase 2 fields
        purchase_order_number: extractedData.purchase_order_number,
        payment_reference: extractedData.payment_reference,
        vendor_tax_id: extractedData.vendor_tax_id,
        // Phase 3 fields
        patient_dob: extractedData.patient_dob,
        treatment_date: extractedData.treatment_date,
        insurance_claim_number: extractedData.insurance_claim_number,
        diagnosis_codes: extractedData.diagnosis_codes,
        procedure_codes: extractedData.procedure_codes,
        provider_id: extractedData.provider_id,
      })
      .eq('id', newReceipt.id)

    if (updateError) {
      console.error('[Upload Converted] Update error:', updateError)
      throw updateError
    }

    console.log(`[Upload Converted] Receipt updated successfully`)

    // 10. Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: newReceipt.id,
        file_name: file.name,
        file_url: publicUrl,
        processing_status: 'completed',
        confidence_score: extractedData.confidence_score,
        merchant_name: extractedData.merchant_name,
        total_amount: extractedData.amount,
        currency: extractedData.currency,
      },
    })
  } catch (error) {
    console.error('[Upload Converted] Error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload and processing failed',
      },
      { status: 500 }
    )
  }
}
