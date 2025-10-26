import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractReceiptData } from '@/lib/openai'

// Configure route segment (Hobby plan max is 10s, Pro supports up to 300s)
export const maxDuration = 10

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  console.log(`[Process Receipt] Starting processing for receipt ${params.id}`)

  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[Process Receipt] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Process Receipt] User authenticated: ${user.id}`)

    // 2. Fetch receipt and verify ownership
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (receiptError || !receipt) {
      console.log(`[Process Receipt] Receipt not found: ${params.id}`)
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.user_id !== user.id) {
      console.log(
        `[Process Receipt] Forbidden - user ${user.id} does not own receipt ${params.id}`
      )
      return NextResponse.json(
        { error: 'Forbidden - you do not own this receipt' },
        { status: 403 }
      )
    }

    // 3. Check if already processed
    if (receipt.processing_status === 'completed') {
      console.log(`[Process Receipt] Receipt already processed: ${params.id}`)
      return NextResponse.json(
        { error: 'Receipt already processed' },
        { status: 409 }
      )
    }

    if (receipt.processing_status === 'processing') {
      console.log(`[Process Receipt] Receipt is currently being processed: ${params.id}`)
      return NextResponse.json(
        { error: 'Receipt is already being processed' },
        { status: 409 }
      )
    }

    // 4. Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log(`[Process Receipt] Failed to fetch user profile: ${user.id}`)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if ((profile.credits ?? 0) < 1) {
      console.log(`[Process Receipt] Insufficient credits for user ${user.id}`)
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to continue.' },
        { status: 402 }
      )
    }

    console.log(`[Process Receipt] User has ${profile.credits} credits`)

    // 5. Update status to processing
    const { error: updateStatusError } = await supabase
      .from('receipts')
      .update({
        processing_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateStatusError) {
      console.error('[Process Receipt] Failed to update status to processing:', updateStatusError)
      return NextResponse.json(
        { error: 'Failed to start processing' },
        { status: 500 }
      )
    }

    console.log(`[Process Receipt] Status updated to 'processing'`)

    try {
      // 6. Generate signed URL (60 seconds)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receipt.file_path, 60)

      if (signedUrlError || !signedUrlData) {
        throw new Error('Failed to generate signed URL for receipt file')
      }

      console.log(`[Process Receipt] Generated signed URL for file: ${receipt.file_path}`)

      // 7. Call OpenAI Vision API
      console.log('[Process Receipt] Calling OpenAI Vision API...')
      const extractedData = await extractReceiptData(signedUrlData.signedUrl)
      console.log('[Process Receipt] Successfully extracted data from OpenAI:', extractedData)

      // 7.5. Validate extracted data
      const validationErrors = validateExtractedData(extractedData)
      const hasValidationErrors = validationErrors.length > 0

      // Lower confidence if validation errors exist
      let finalConfidence = extractedData.confidence_score
      if (hasValidationErrors) {
        finalConfidence = Math.min(finalConfidence, 0.6)
        console.log('[Process Receipt] Validation errors found:', validationErrors)
      }

      // 8. Update receipt with extracted data
      const { error: updateDataError } = await supabase
        .from('receipts')
        .update({
          merchant_name: extractedData.merchant_name,
          total_amount: extractedData.amount,
          currency: extractedData.currency,
          receipt_date: extractedData.receipt_date,
          category: extractedData.category,
          tax_amount: extractedData.tax_amount,
          payment_method: extractedData.payment_method,
          confidence_score: finalConfidence,
          raw_ocr_text: extractedData.raw_text,
          processing_status: 'completed',
          processing_error: hasValidationErrors ? validationErrors.join('; ') : null,
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
        .eq('id', params.id)

      if (updateDataError) {
        throw new Error('Failed to update receipt with extracted data')
      }

      console.log(`[Process Receipt] Receipt updated with extracted data`)

      // 8.5. Save line items if present (Phase 2)
      if (extractedData.line_items && extractedData.line_items.length > 0) {
        console.log(`[Process Receipt] Saving ${extractedData.line_items.length} line items...`)

        // Delete existing line items (if re-processing)
        const { error: deleteError } = await supabase
          .from('receipt_line_items')
          .delete()
          .eq('receipt_id', params.id)

        if (deleteError) {
          console.error('[Process Receipt] Failed to delete old line items:', deleteError)
          // Continue anyway - this is not critical
        }

        // Insert new line items
        const lineItemsToInsert = extractedData.line_items.map((item) => ({
          receipt_id: params.id,
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
          console.error('[Process Receipt] Failed to insert line items:', insertError)
          // Don't fail the entire request - line items are optional
        } else {
          console.log(`[Process Receipt] Successfully saved ${extractedData.line_items.length} line items`)
        }
      }

      // 9. Deduct 1 credit from user
      const { error: deductCreditError } = await supabase
        .from('profiles')
        .update({
          credits: (profile.credits ?? 0) - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (deductCreditError) {
        console.error('[Process Receipt] Failed to deduct credit:', deductCreditError)
        // Don't fail the request, but log the error
      } else {
        console.log(`[Process Receipt] Deducted 1 credit. Remaining: ${(profile.credits ?? 0) - 1}`)
      }

      // 10. Create credit transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -1,
          transaction_type: 'deduction',
          description: `Receipt processing: ${receipt.file_name}`,
          receipt_id: params.id,
        })

      if (transactionError) {
        console.error('[Process Receipt] Failed to create transaction record:', transactionError)
        // Don't fail the request, but log the error
      }

      const processingTime = Date.now() - startTime
      console.log(`[Process Receipt] Successfully processed receipt in ${processingTime}ms`)

      return NextResponse.json({
        success: true,
        data: extractedData,
        credits_remaining: (profile.credits ?? 0) - 1,
        processing_time_ms: processingTime,
      })
    } catch (processingError) {
      // Handle processing failure
      console.error('[Process Receipt] Processing error:', processingError)

      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown error during processing'

      // Update receipt status to failed
      await supabase
        .from('receipts')
        .update({
          processing_status: 'failed',
          processing_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      console.log(`[Process Receipt] Updated status to 'failed' with error: ${errorMessage}`)

      return NextResponse.json(
        {
          error: 'Failed to process receipt',
          details: errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Process Receipt] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Validate extracted receipt data
 */
function validateExtractedData(data: {
  amount: number
  currency: string
  receipt_date: string | null
}): string[] {
  const errors: string[] = []

  // Validate amount
  if (data.amount <= 0) {
    errors.push('Amount must be positive')
  }
  if (data.amount > 1000000) {
    errors.push('Amount seems unusually high')
  }

  // Validate currency
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY']
  if (!supportedCurrencies.includes(data.currency)) {
    errors.push(`Currency ${data.currency} may not be supported`)
  }

  // Validate date
  if (data.receipt_date) {
    const receiptDate = new Date(data.receipt_date)
    const today = new Date()
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(today.getFullYear() - 10)

    if (receiptDate > today) {
      errors.push('Receipt date cannot be in the future')
    }
    if (receiptDate < tenYearsAgo) {
      errors.push('Receipt date is more than 10 years old')
    }
  }

  return errors
}
