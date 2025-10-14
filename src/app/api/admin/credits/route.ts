import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { userId, action, amount } = await request.json()

    if (!userId || !action || !amount) {
      return NextResponse.json(
        { error: 'userId, action, and amount are required' },
        { status: 400 }
      )
    }

    if (!['add', 'subtract', 'set'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const parsedAmount = parseInt(amount)
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const currentCredits = profile?.credits || 0
    let newCredits = currentCredits

    switch (action) {
      case 'add':
        newCredits = currentCredits + parsedAmount
        break
      case 'subtract':
        newCredits = Math.max(0, currentCredits - parsedAmount)
        break
      case 'set':
        newCredits = parsedAmount
        break
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      oldCredits: currentCredits,
      newCredits,
      action,
      amount: parsedAmount,
    })
  } catch (error) {
    console.error('Credit adjustment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
