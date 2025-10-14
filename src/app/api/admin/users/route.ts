import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    // Verify admin access
    try {
      await verifyAdminAccess(request)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unauthorized'
      console.error('[Admin API] Access denied:', errorMessage)
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get all users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filter users by email (partial match)
    const matchingAuthUsers = authData.users.filter((u) =>
      u.email?.toLowerCase().includes(email.toLowerCase())
    )

    if (matchingAuthUsers.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get profiles for matching users
    const userIds = matchingAuthUsers.map((u) => u.id)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, credits, created_at')
      .in('id', userIds)

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Combine auth and profile data
    const combinedUsers = profiles.map((p) => {
      const authUser = matchingAuthUsers.find((u) => u.id === p.id)
      return {
        id: p.id,
        email: authUser?.email || 'Unknown',
        full_name: p.full_name,
        credits: p.credits || 0,
        created_at: p.created_at,
      }
    })

    return NextResponse.json({ users: combinedUsers })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
