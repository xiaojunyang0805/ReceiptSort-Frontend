/**
 * Setup Admin Script
 *
 * Adds is_admin column to profiles table and sets admin users
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin() {
  console.log('🔧 Setting up admin access...')
  console.log('=' .repeat(50))

  try {
    // Step 1: Add is_admin column to profiles table
    console.log('\n📊 Adding is_admin column to profiles table...')

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE'
    })

    // Note: rpc might not exist, so we'll use a direct approach
    // We'll manually execute through the admin API

    // Step 2: Find the admin user
    console.log('\n🔍 Looking up admin user: xiaojunyang0805@gmail.com')

    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('❌ Error fetching users:', userError.message)
      process.exit(1)
    }

    const adminUser = users.users.find(u => u.email === 'xiaojunyang0805@gmail.com')

    if (!adminUser) {
      console.error('❌ Admin user not found: xiaojunyang0805@gmail.com')
      console.log('\n📋 Available users:')
      users.users.forEach(u => console.log(`   - ${u.email}`))
      process.exit(1)
    }

    console.log(`✓ Found admin user: ${adminUser.id}`)

    // Step 3: Set is_admin flag for the user
    console.log('\n🔐 Setting admin privileges...')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', adminUser.id)

    if (updateError) {
      console.error('❌ Error setting admin flag:', updateError.message)
      process.exit(1)
    }

    // Step 4: Verify the change
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('is_admin, credits')
      .eq('id', adminUser.id)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying admin status:', verifyError.message)
      process.exit(1)
    }

    console.log('\n✅ Admin setup completed successfully!')
    console.log('=' .repeat(50))
    console.log(`📧 Email: xiaojunyang0805@gmail.com`)
    console.log(`🔐 Admin: ${profile.is_admin}`)
    console.log(`💳 Credits: ${profile.credits}`)
    console.log('\n⚠️  Note: You may need to manually add the is_admin column')
    console.log('   in Supabase SQL Editor if it does not exist yet.')
    console.log('\n   SQL: ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

setupAdmin()
