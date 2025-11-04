#!/usr/bin/env node
/**
 * Reset Stuck Receipts Script
 *
 * Resets receipts stuck in "processing" status to "failed" status
 * This helps clean up stuck receipts and provides clear error messages to users
 *
 * Usage: node scripts/debugging/reset-stuck-receipts.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Check if dry-run mode
const isDryRun = process.argv.includes('--dry-run')

async function resetStuckReceipts() {
  console.log('🔄 Reset Stuck Receipts Script\n')
  console.log('━'.repeat(80))

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n')
  }

  try {
    // Find all receipts stuck in "processing" status
    const { data: stuckReceipts, error } = await supabase
      .from('receipts')
      .select('id, file_name, created_at, updated_at, user_id')
      .eq('processing_status', 'processing')
      .order('updated_at', { ascending: true })

    if (error) {
      throw error
    }

    if (!stuckReceipts || stuckReceipts.length === 0) {
      console.log('✅ No stuck receipts found!')
      console.log('━'.repeat(80))
      return
    }

    console.log(`\n📋 Found ${stuckReceipts.length} stuck receipt(s)\n`)

    // Calculate how long each receipt has been stuck
    const now = new Date()
    const receiptsWithDuration = stuckReceipts.map(receipt => {
      const updatedAt = new Date(receipt.updated_at)
      const stuckMinutes = Math.floor((now - updatedAt) / 1000 / 60)
      return { ...receipt, stuckMinutes }
    })

    // Display receipts
    for (const receipt of receiptsWithDuration) {
      console.log(`   📄 ${receipt.file_name}`)
      console.log(`      ID: ${receipt.id}`)
      console.log(`      Stuck for: ${receipt.stuckMinutes} minutes`)
      console.log(`      Updated: ${receipt.updated_at}`)
      console.log('')
    }

    if (isDryRun) {
      console.log('━'.repeat(80))
      console.log('\n✅ Dry run complete. Run without --dry-run to reset these receipts.\n')
      return
    }

    // Ask for confirmation
    console.log('━'.repeat(80))
    console.log('\n⚠️  This will mark all stuck receipts as "failed"')
    console.log('   Users will see an error message and can retry processing.')
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n')

    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('🔄 Resetting receipts...\n')

    let successCount = 0
    let failureCount = 0

    for (const receipt of stuckReceipts) {
      try {
        const { error: updateError } = await supabase
          .from('receipts')
          .update({
            processing_status: 'failed',
            processing_error: 'Processing timeout - Receipt was stuck in processing status and has been reset. Please try uploading again.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', receipt.id)

        if (updateError) {
          console.log(`   ❌ Failed to reset ${receipt.file_name}: ${updateError.message}`)
          failureCount++
        } else {
          console.log(`   ✅ Reset ${receipt.file_name}`)
          successCount++
        }
      } catch (err) {
        console.log(`   ❌ Error resetting ${receipt.file_name}:`, err)
        failureCount++
      }
    }

    console.log('\n' + '━'.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Successfully reset: ${successCount}`)
    console.log(`   ❌ Failed to reset: ${failureCount}`)
    console.log(`   📋 Total processed: ${stuckReceipts.length}`)

    if (successCount > 0) {
      console.log('\n✅ Stuck receipts have been reset!')
      console.log('   Users can now see the error and retry processing.')
    }

    console.log('━'.repeat(80))
    console.log('')

  } catch (error) {
    console.error('❌ Error resetting stuck receipts:', error)
    process.exit(1)
  }
}

resetStuckReceipts()
