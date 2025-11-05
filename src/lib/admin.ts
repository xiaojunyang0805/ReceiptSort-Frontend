/**
 * Admin Utilities
 *
 * Functions to check and verify admin access
 */

import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Check if a user is an admin (server-side)
 * Use this in API routes
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    if (!supabaseServiceKey) {
      console.error('[Admin] Missing SUPABASE_SERVICE_ROLE_KEY')
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Admin] Error checking admin status:', error)
      return false
    }

    return data?.is_admin === true
  } catch (error) {
    console.error('[Admin] Error in isUserAdmin:', error)
    return false
  }
}

/**
 * Check if current user is admin (client-side)
 * Use this in React components
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Admin] Error checking admin status:', error)
      return false
    }

    return data?.is_admin === true
  } catch (error) {
    console.error('[Admin] Error in checkIsAdmin:', error)
    return false
  }
}

/**
 * Verify admin access and return user ID (for API routes)
 * Throws error if not admin
 */
export async function verifyAdminAccess(request: Request): Promise<string> {
  try {
    if (!supabaseServiceKey) {
      throw new Error('Server configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Error verifying admin status')
    }

    if (!profile?.is_admin) {
      throw new Error('Forbidden: Admin access required')
    }

    return user.id
  } catch (error) {
    throw error
  }
}
