import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns this receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('file_path, user_id')
      .eq('id', params.id)
      .single()

    if (receiptError || !receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (receipt.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you do not own this receipt' },
        { status: 403 }
      )
    }

    // Generate signed URL (valid for 5 minutes = 300 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('receipts')
      .createSignedUrl(receipt.file_path, 300)

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    })
  } catch (error) {
    console.error('Error in signed URL endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
