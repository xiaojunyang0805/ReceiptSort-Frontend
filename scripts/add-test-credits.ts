/**
 * Add Test Credits Script
 *
 * Adds credits to a user account for testing purposes.
 *
 * Usage:
 *   npm run seed:credits -- <user-email> <amount>
 *   npm run seed:credits -- user@example.com 100
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
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCredits(userEmail: string, creditsToAdd: number) {
  console.log(`🔍 Looking up user: ${userEmail}`)

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('❌ Error fetching users:', userError.message)
    process.exit(1)
  }

  const user = users.users.find(u => u.email === userEmail)

  if (!user) {
    console.error(`❌ User not found: ${userEmail}`)
    console.log('\n📋 Available users:')
    users.users.forEach(u => console.log(`   - ${u.email}`))
    process.exit(1)
  }

  console.log(`✓ Found user: ${user.id}`)

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError.message)
    process.exit(1)
  }

  const currentCredits = profile?.credits ?? 0
  const newCredits = currentCredits + creditsToAdd

  console.log(`💳 Current credits: ${currentCredits}`)
  console.log(`➕ Adding: ${creditsToAdd}`)
  console.log(`💰 New total: ${newCredits}`)

  // Update credits
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('❌ Error updating credits:', updateError.message)
    process.exit(1)
  }

  // Create transaction record
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: creditsToAdd,
      transaction_type: 'purchase',
      description: `Test credits added via script`,
    })

  if (transactionError) {
    console.error('⚠️  Warning: Failed to create transaction record:', transactionError.message)
  }

  console.log('\n✅ Credits added successfully!')
}

// Parse command line arguments
const args = process.argv.slice(2)
const userEmail = args[0]
const creditsAmount = parseInt(args[1] || '100', 10)

if (!userEmail) {
  console.error('Usage: npm run seed:credits -- <user-email> [amount]')
  console.error('Example: npm run seed:credits -- user@example.com 100')
  process.exit(1)
}

if (isNaN(creditsAmount) || creditsAmount <= 0) {
  console.error('❌ Invalid credits amount. Must be a positive number.')
  process.exit(1)
}

console.log('💳 Add Test Credits to User')
console.log('=' .repeat(50))

addCredits(userEmail, creditsAmount).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
