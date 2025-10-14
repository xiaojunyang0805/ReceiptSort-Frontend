/**
 * Check Profiles Table Structure
 *
 * Verifies the actual structure and data in the profiles table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkProfiles() {
  console.log('🔍 Checking Profiles Table Structure')
  console.log('=' .repeat(60))

  try {
    // Get all profiles with all columns
    console.log('\n📋 Fetching all profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
      return
    }

    console.log(`\n✓ Found ${profiles?.length || 0} profiles\n`)

    // Display each profile
    profiles?.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`)
      console.log(`  id: ${profile.id}`)
      console.log(`  full_name: ${profile.full_name || '(empty)'}`)
      console.log(`  credits: ${profile.credits}`)
      console.log(`  is_admin: ${profile.is_admin}`)
      console.log(`  created_at: ${profile.created_at}`)
      console.log(`  updated_at: ${profile.updated_at}`)
      console.log('')
    })

    // Get user emails
    console.log('📧 Getting user emails...\n')
    const { data: users } = await supabase.auth.admin.listUsers()

    profiles?.forEach((profile) => {
      const user = users?.users.find(u => u.id === profile.id)
      if (user) {
        console.log(`${user.email}: is_admin=${profile.is_admin}, credits=${profile.credits}`)
      }
    })

    // Check specifically for xiaojunyang0805@gmail.com
    console.log('\n🔍 Checking xiaojunyang0805@gmail.com specifically...')
    const adminUser = users?.users.find(u => u.email === 'xiaojunyang0805@gmail.com')

    if (adminUser) {
      console.log(`✓ Found user: ${adminUser.id}`)

      const adminProfile = profiles?.find(p => p.id === adminUser.id)
      if (adminProfile) {
        console.log('✓ Profile exists:')
        console.log(`  is_admin: ${adminProfile.is_admin}`)
        console.log(`  credits: ${adminProfile.credits}`)
        console.log(`  Type of is_admin: ${typeof adminProfile.is_admin}`)
        console.log(`  Raw value: ${JSON.stringify(adminProfile.is_admin)}`)
      } else {
        console.log('❌ No profile found for this user!')
      }
    } else {
      console.log('❌ User xiaojunyang0805@gmail.com not found!')
    }

    // Test direct query with RLS
    console.log('\n🔐 Testing RLS policy (as authenticated user)...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', adminUser?.id)
      .single()

    if (testError) {
      console.error('❌ RLS Test Error:', testError)
    } else {
      console.log('✓ RLS Test Passed:', testData)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

checkProfiles()
