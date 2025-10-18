import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  console.log('🔍 Checking Profiles and Users...\n')

  // Check auth.users
  console.log('1. Checking auth.users table...')
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('   ❌ Error:', authError.message)
  } else {
    console.log(`   ✅ Found ${authUsers.users.length} user(s) in auth.users`)
    authUsers.users.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`)
      console.log(`     Provider: ${user.app_metadata.provider || 'email'}`)
      console.log(`     Created: ${new Date(user.created_at).toLocaleString()}`)
    })
  }

  // Check profiles table
  console.log('\n2. Checking profiles table...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')

  if (profileError) {
    console.log('   ❌ Error:', profileError.message)
  } else {
    console.log(`   ✅ Found ${profiles.length} profile(s)`)
    if (profiles.length === 0) {
      console.log('   ⚠️  No profiles found - trigger is not working!')
    } else {
      profiles.forEach(profile => {
        console.log(`   - ${profile.email}: ${profile.credits_remaining} credits`)
      })
    }
  }

  // Check if profiles need to be created manually
  if (authUsers.users.length > 0 && (!profiles || profiles.length === 0)) {
    console.log('\n⚠️  ISSUE DETECTED:')
    console.log('   Users exist in auth.users but NO profiles exist.')
    console.log('   The trigger is NOT working.')
    console.log('\n📋 Solution:')
    console.log('   Run the SQL in fix-trigger-oauth.sql in Supabase SQL Editor')
    console.log('   Then manually create profiles for existing users:')
    console.log('')
    authUsers.users.forEach(user => {
      console.log(`   INSERT INTO profiles (id, email, credits_remaining, created_at, updated_at)`)
      console.log(`   VALUES ('${user.id}', '${user.email}', 10, now(), now());`)
      console.log('')
    })
  }
}

checkProfiles().catch(console.error)
