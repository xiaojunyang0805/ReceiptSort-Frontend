import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Configure route segment for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mark a receipt as failed
 * Used when client-side timeout occurs or processing fails
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[Mark Failed] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const errorMessage = body.error || 'Processing failed'

    console.log(`[Mark Failed] Marking receipt ${params.id} as failed: ${errorMessage}`)

    // 3. Fetch receipt and verify ownership
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('user_id, processing_status')
      .eq('id', params.id)
      .single()

    if (receiptError || !receipt) {
      console.log(`[Mark Failed] Receipt not found: ${params.id}`)
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    if (receipt.user_id !== user.id) {
      console.log(`[Mark Failed] Forbidden - user ${user.id} does not own receipt ${params.id}`)
      return NextResponse.json(
        { error: 'Forbidden - you do not own this receipt' },
        { status: 403 }
      )
    }

    // 4. Update receipt status to failed
    const { error: updateError } = await supabase
      .from('receipts')
      .update({
        processing_status: 'failed',
        processing_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[Mark Failed] Failed to update receipt status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update receipt status' },
        { status: 500 }
      )
    }

    console.log(`[Mark Failed] Successfully marked receipt ${params.id} as failed`)

    return NextResponse.json({
      success: true,
      message: 'Receipt marked as failed',
    })
  } catch (error) {
    console.error('[Mark Failed] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
