import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractReceiptData } from '@/lib/openai'

interface BulkProcessRequest {
  receipt_ids: string[]
}

interface ProcessResult {
  receipt_id: string
  success: boolean
  data?: {
    merchant_name: string
    amount: number
    currency: string
    receipt_date: string | null
    category: string
  }
  error?: string
}

/**
 * Delay utility to avoid rate limits
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('[Bulk Process] Starting bulk processing request')

  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[Bulk Process] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    let body: BulkProcessRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { receipt_ids } = body

    if (!Array.isArray(receipt_ids) || receipt_ids.length === 0) {
      return NextResponse.json(
        { error: 'receipt_ids must be a non-empty array' },
        { status: 400 }
      )
    }

    console.log(`[Bulk Process] Processing ${receipt_ids.length} receipts for user ${user.id}`)

    // 3. Fetch user profile to check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log(`[Bulk Process] Failed to fetch user profile: ${user.id}`)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    const initialCredits = profile.credits ?? 0
    console.log(`[Bulk Process] User has ${initialCredits} credits`)

    if (initialCredits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 402 }
      )
    }

    // 4. Process each receipt sequentially
    const results: ProcessResult[] = []
    let creditsUsed = 0
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < receipt_ids.length; i++) {
      const receiptId = receipt_ids[i]
      console.log(`[Bulk Process] Processing receipt ${i + 1}/${receipt_ids.length}: ${receiptId}`)

      try {
        // Check if user still has credits
        const currentCredits = initialCredits - creditsUsed
        if (currentCredits < 1) {
          console.log(`[Bulk Process] Out of credits after ${creditsUsed} receipts`)
          results.push({
            receipt_id: receiptId,
            success: false,
            error: 'Insufficient credits',
          })
          failureCount++
          continue
        }

        // Fetch receipt
        const { data: receipt, error: receiptError } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', receiptId)
          .eq('user_id', user.id)
          .single()

        if (receiptError || !receipt) {
          console.log(`[Bulk Process] Receipt not found or not owned: ${receiptId}`)
          results.push({
            receipt_id: receiptId,
            success: false,
            error: 'Receipt not found or access denied',
          })
          failureCount++
          continue
        }

        // Skip if already processed
        if (receipt.processing_status === 'completed') {
          console.log(`[Bulk Process] Receipt already processed: ${receiptId}`)
          results.push({
            receipt_id: receiptId,
            success: false,
            error: 'Receipt already processed',
          })
          failureCount++
          continue
        }

        // Skip if currently processing
        if (receipt.processing_status === 'processing') {
          console.log(`[Bulk Process] Receipt is being processed: ${receiptId}`)
          results.push({
            receipt_id: receiptId,
            success: false,
            error: 'Receipt is already being processed',
          })
          failureCount++
          continue
        }

        // Update status to processing
        await supabase
          .from('receipts')
          .update({
            processing_status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', receiptId)

        try {
          // Generate signed URL
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('receipts')
            .createSignedUrl(receipt.file_path, 60)

          if (signedUrlError || !signedUrlData) {
            throw new Error('Failed to generate signed URL')
          }

          // Call OpenAI Vision API
          console.log(`[Bulk Process] Calling OpenAI for receipt ${receiptId}`)
          const extractedData = await extractReceiptData(signedUrlData.signedUrl)

          // Update receipt with extracted data
          await supabase
            .from('receipts')
            .update({
              merchant_name: extractedData.merchant_name,
              total_amount: extractedData.amount,
              currency: extractedData.currency,
              receipt_date: extractedData.receipt_date,
              category: extractedData.category,
              tax_amount: extractedData.tax_amount,
              payment_method: extractedData.payment_method,
              confidence_score: extractedData.confidence_score,
              raw_ocr_text: extractedData.raw_text,
              processing_status: 'completed',
              processing_error: null,
              updated_at: new Date().toISOString(),

              // Phase 1: Essential Fields
              invoice_number: extractedData.invoice_number,
              document_type: extractedData.document_type,
              subtotal: extractedData.subtotal,
              vendor_address: extractedData.vendor_address,
              due_date: extractedData.due_date,

              // Phase 2: Business Invoices
              purchase_order_number: extractedData.purchase_order_number,
              payment_reference: extractedData.payment_reference,
              vendor_tax_id: extractedData.vendor_tax_id,

              // Phase 3: Medical Receipts
              patient_dob: extractedData.patient_dob,
              treatment_date: extractedData.treatment_date,
              insurance_claim_number: extractedData.insurance_claim_number,
              diagnosis_codes: extractedData.diagnosis_codes,
              procedure_codes: extractedData.procedure_codes,
              provider_id: extractedData.provider_id,
            })
            .eq('id', receiptId)

          // Save line items if present (Phase 2)
          if (extractedData.line_items && extractedData.line_items.length > 0) {
            console.log(`[Bulk Process] Saving ${extractedData.line_items.length} line items for receipt ${receiptId}`)

            // Delete existing line items (if re-processing)
            await supabase
              .from('receipt_line_items')
              .delete()
              .eq('receipt_id', receiptId)

            // Insert new line items
            const lineItemsToInsert = extractedData.line_items.map((item) => ({
              receipt_id: receiptId,
              line_number: item.line_number,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
              item_code: item.item_code,
              tax_rate: item.tax_rate,
            }))

            const { error: insertError } = await supabase
              .from('receipt_line_items')
              .insert(lineItemsToInsert)

            if (insertError) {
              console.error(`[Bulk Process] Failed to insert line items for receipt ${receiptId}:`, insertError)
              // Don't fail the entire request - line items are optional
            }
          }

          // Deduct credit
          await supabase
            .from('profiles')
            .update({
              credits: initialCredits - creditsUsed - 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          // Create transaction record
          await supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: -1,
            transaction_type: 'deduction',
            description: `Bulk processing: ${receipt.file_name}`,
            receipt_id: receiptId,
          })

          creditsUsed++
          successCount++

          results.push({
            receipt_id: receiptId,
            success: true,
            data: {
              merchant_name: extractedData.merchant_name,
              amount: extractedData.amount,
              currency: extractedData.currency,
              receipt_date: extractedData.receipt_date,
              category: extractedData.category,
            },
          })

          console.log(`[Bulk Process] Successfully processed receipt ${receiptId}`)
        } catch (processingError) {
          // Update receipt to failed status
          const errorMessage =
            processingError instanceof Error
              ? processingError.message
              : 'Unknown error'

          await supabase
            .from('receipts')
            .update({
              processing_status: 'failed',
              processing_error: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', receiptId)

          failureCount++
          results.push({
            receipt_id: receiptId,
            success: false,
            error: errorMessage,
          })

          console.log(`[Bulk Process] Failed to process receipt ${receiptId}: ${errorMessage}`)
        }

        // Add delay between requests to avoid rate limits (1 second)
        if (i < receipt_ids.length - 1) {
          console.log('[Bulk Process] Waiting 1 second before next request...')
          await delay(1000)
        }
      } catch (error) {
        console.error(`[Bulk Process] Unexpected error for receipt ${receiptId}:`, error)
        failureCount++
        results.push({
          receipt_id: receiptId,
          success: false,
          error: 'Unexpected error',
        })
      }
    }

    const processingTime = Date.now() - startTime
    const creditsRemaining = initialCredits - creditsUsed

    console.log(`[Bulk Process] Completed bulk processing in ${processingTime}ms`)
    console.log(`[Bulk Process] Success: ${successCount}, Failed: ${failureCount}, Credits used: ${creditsUsed}`)

    return NextResponse.json({
      success: true,
      summary: {
        total: receipt_ids.length,
        successful: successCount,
        failed: failureCount,
        credits_used: creditsUsed,
        credits_remaining: creditsRemaining,
        processing_time_ms: processingTime,
      },
      results,
    })
  } catch (error) {
    console.error('[Bulk Process] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
