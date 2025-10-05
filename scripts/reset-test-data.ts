/**
 * Reset Test Data Script
 *
 * Clears test receipts and resets user to initial state.
 * WARNING: This will delete all receipts for the specified user!
 *
 * Usage:
 *   npm run seed:reset -- <user-email>
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

async function resetUserData(userEmail: string, resetCredits: number = 10) {
  console.log(`🔍 Looking up user: ${userEmail}`)

  // Find user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('❌ Error fetching users:', userError.message)
    process.exit(1)
  }

  const user = users.users.find(u => u.email === userEmail)

  if (!user) {
    console.error(`❌ User not found: ${userEmail}`)
    process.exit(1)
  }

  console.log(`✓ Found user: ${user.id}`)

  // Get receipts
  const { data: receipts, error: receiptsError } = await supabase
    .from('receipts')
    .select('id, file_path')
    .eq('user_id', user.id)

  if (receiptsError) {
    console.error('❌ Error fetching receipts:', receiptsError.message)
    process.exit(1)
  }

  console.log(`\n📄 Found ${receipts?.length || 0} receipts`)

  if (receipts && receipts.length > 0) {
    console.log('🗑️  Deleting receipts from storage...')

    // Delete files from storage
    const filePaths = receipts.map(r => r.file_path)
    const { error: storageError } = await supabase.storage
      .from('receipts')
      .remove(filePaths)

    if (storageError) {
      console.error('⚠️  Warning: Some files may not have been deleted:', storageError.message)
    }

    // Delete receipt records
    console.log('🗑️  Deleting receipt records...')
    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting receipts:', deleteError.message)
      process.exit(1)
    }

    console.log(`✓ Deleted ${receipts.length} receipts`)
  }

  // Delete credit transactions
  console.log('🗑️  Clearing credit transaction history...')
  const { error: transactionsError } = await supabase
    .from('credit_transactions')
    .delete()
    .eq('user_id', user.id)

  if (transactionsError) {
    console.error('⚠️  Warning: Failed to clear transactions:', transactionsError.message)
  }

  // Reset credits
  console.log(`💳 Resetting credits to ${resetCredits}...`)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      credits: resetCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('❌ Error resetting credits:', updateError.message)
    process.exit(1)
  }

  console.log('\n✅ User data reset successfully!')
  console.log(`   Receipts: 0`)
  console.log(`   Credits: ${resetCredits}`)
  console.log(`   Transactions: 0`)
}

// Parse command line arguments
const args = process.argv.slice(2)
const userEmail = args[0]
const resetCredits = parseInt(args[1] || '10', 10)

if (!userEmail) {
  console.error('Usage: npm run seed:reset -- <user-email> [credits]')
  console.error('Example: npm run seed:reset -- user@example.com 10')
  process.exit(1)
}

console.log('⚠️  WARNING: This will delete ALL receipts for this user!')
console.log('=' .repeat(50))

// Simple confirmation
console.log(`\nUser: ${userEmail}`)
console.log(`Reset credits to: ${resetCredits}`)
console.log('\nPress Ctrl+C to cancel, or continue to reset data...\n')

setTimeout(() => {
  resetUserData(userEmail, resetCredits).catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}, 2000)
