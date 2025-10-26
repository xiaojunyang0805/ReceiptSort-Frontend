import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractReceiptData } from '@/lib/openai'

// Configure route segment (Hobby plan max is 10s, Pro supports up to 300s)
export const maxDuration = 10

/**
 * POST /api/receipts/[id]/retry
 * Retry processing a failed receipt without deducting credits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[Retry] Starting retry for receipt:', params.id)
  try {
    const supabase = await createClient()
    const receiptId = params.id
    console.log('[Retry] Receipt ID:', receiptId)

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[Retry] Auth failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Retry] User authenticated:', user.id)

    // 2. Get receipt and verify ownership
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // 3. Verify receipt can be retried (pending, failed, or low confidence)
    // Allow: pending (stuck during upload), failed, or completed with low confidence
    const canRetry =
      receipt.processing_status === 'pending' ||
      receipt.processing_status === 'failed' ||
      (receipt.processing_status === 'completed' && (receipt.confidence_score ?? 1) < 0.7)

    if (!canRetry) {
      return NextResponse.json(
        { error: 'Only pending, failed, or low confidence receipts can be retried' },
        { status: 400 }
      )
    }

    // 4. Update status to processing
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        processing_status: 'processing',
        processing_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', receiptId)

    if (updateError) {
      throw new Error('Failed to update receipt status')
    }

    // 5. Get signed URL for the image
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(receipt.file_path, 300) // 5 min expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error('Failed to get signed URL for receipt image')
    }

    // 6. Extract data using OpenAI Vision
    let extractedData
    try {
      extractedData = await extractReceiptData(signedUrlData.signedUrl)
    } catch (extractionError) {
      const errorMessage =
        extractionError instanceof Error
          ? extractionError.message
          : 'Failed to extract receipt data'

      // Update receipt with error
      await supabase
        .from('receipts')
        .update({
          processing_status: 'failed',
          processing_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receiptId)

      return NextResponse.json(
        { error: errorMessage, retryable: true },
        { status: 500 }
      )
    }

    // 7. Validate extracted data
    const validationErrors = validateExtractedData(extractedData)
    const hasValidationErrors = validationErrors.length > 0

    // Lower confidence if validation errors exist
    let finalConfidence = extractedData.confidence_score
    if (hasValidationErrors) {
      finalConfidence = Math.min(finalConfidence, 0.6)
    }

    // 8. Update receipt with extracted data
    const { error: finalUpdateError } = await supabase
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
        confidence_score: finalConfidence,
        raw_ocr_text: extractedData.raw_text,
        processing_error: hasValidationErrors ? validationErrors.join('; ') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', receiptId)

    if (finalUpdateError) {
      throw new Error('Failed to update receipt with extracted data')
    }

    return NextResponse.json({
      success: true,
      data: {
        ...extractedData,
        confidence_score: finalConfidence,
        validation_warnings: validationErrors,
      },
    })
  } catch (error) {
    console.error('Receipt retry error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry receipt processing',
        retryable: true,
      },
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
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY']
  if (!supportedCurrencies.includes(data.currency)) {
    errors.push(`Currency ${data.currency} may not be supported`)
  }

  // Validate date
  if (data.receipt_date) {
    const receiptDate = new Date(data.receipt_date)
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 10)

    if (receiptDate > today) {
      errors.push('Receipt date cannot be in the future')
    }
    if (receiptDate < oneYearAgo) {
      errors.push('Receipt date is more than 10 years old')
    }
  }

  return errors
}
