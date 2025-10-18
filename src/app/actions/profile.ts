'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(fullName: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Validate input
    if (!fullName || fullName.trim().length === 0) {
      return { error: 'Name cannot be empty' }
    }

    if (fullName.trim().length > 100) {
      return { error: 'Name is too long (max 100 characters)' }
    }

    // Update profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Profile Update] Error:', updateError)
      return { error: 'Failed to update profile' }
    }

    // Revalidate the account page to show updated data
    revalidatePath('/account')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('[Profile Update] Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
