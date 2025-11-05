import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Authentication Setup...\n')

  // Check if handle_new_user function exists
  console.log('1. Checking handle_new_user() function...')
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .eq('proname', 'handle_new_user')
    .single()

  if (funcError) {
    console.log('   Method 1 failed, trying alternative...')

    // Try to check via RPC if available
    const testQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'handle_new_user'
      ) as function_exists;
    `
    console.log('   Function check: Unable to verify directly')
    console.log('   ⚠️  You may need to recreate the trigger function')
  } else {
    console.log('   ✅ Function handle_new_user() exists')
  }

  // Check authentication providers
  console.log('\n2. Checking enabled auth providers...')
  console.log('   Note: Cannot check providers via API')
  console.log('   Please verify in Supabase Dashboard → Authentication → Providers')
  console.log('   Required: Email and optionally Google')

  // Check profiles table structure
  console.log('\n3. Checking profiles table structure...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(0)

  if (profileError) {
    console.log('   ❌ Error accessing profiles table:', profileError.message)
  } else {
    console.log('   ✅ Profiles table is accessible')
  }

  // Check recent auth errors
  console.log('\n4. Checking for recent signup attempts...')
  const { data: profiles, error: listError } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (listError) {
    console.log('   ❌ Error:', listError.message)
  } else {
    console.log(`   ✅ Found ${profiles?.length || 0} profiles`)
    if (profiles?.length > 0) {
      console.log('   Recent profiles:')
      profiles.forEach(p => {
        console.log(`   - ${p.email} (${new Date(p.created_at).toLocaleString()})`)
      })
    }
  }

  // Instructions
  console.log('\n📋 Next Steps:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/xalcrmpqhtakgkqiyere')
  console.log('   2. SQL Editor → Run database-policies.sql to recreate trigger')
  console.log('   3. Authentication → Providers → Enable Google (if needed)')
  console.log('   4. For Google OAuth: Add Client ID & Secret from Google Cloud Console')
  console.log('\n   Google OAuth Redirect URI:')
  console.log('   https://xalcrmpqhtakgkqiyere.supabase.co/auth/v1/callback')
}

diagnoseAuth().catch(console.error)
