#!/usr/bin/env node
/**
 * Cleanup script to reset stuck "processing" receipts
 *
 * Receipts stuck in "processing" for more than 2 minutes are reset to "pending"
 * so they can be retried by users.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupStuckReceipts() {
  console.log('🔍 Checking for stuck receipts...\n')

  // Find receipts stuck in processing for more than 2 minutes
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const { data: stuckReceipts, error: fetchError } = await supabase
    .from('receipts')
    .select('id, file_name, processing_status, updated_at, user_id')
    .eq('processing_status', 'processing')
    .lt('updated_at', twoMinutesAgo)

  if (fetchError) {
    console.error('❌ Error fetching stuck receipts:', fetchError)
    process.exit(1)
  }

  if (!stuckReceipts || stuckReceipts.length === 0) {
    console.log('✅ No stuck receipts found!')
    return
  }

  console.log(`Found ${stuckReceipts.length} stuck receipt(s):\n`)
  stuckReceipts.forEach((receipt, index) => {
    console.log(`${index + 1}. ${receipt.file_name}`)
    console.log(`   ID: ${receipt.id}`)
    console.log(`   Last updated: ${receipt.updated_at}`)
    console.log(`   User: ${receipt.user_id}`)
    console.log()
  })

  // Reset them to failed with error message
  const { error: updateError } = await supabase
    .from('receipts')
    .update({
      processing_status: 'failed',
      processing_error: 'Processing timed out. Please click Retry to process again.',
      updated_at: new Date().toISOString(),
    })
    .eq('processing_status', 'processing')
    .lt('updated_at', twoMinutesAgo)

  if (updateError) {
    console.error('❌ Error updating stuck receipts:', updateError)
    process.exit(1)
  }

  console.log(`✅ Successfully reset ${stuckReceipts.length} receipt(s) to "failed" status`)
  console.log('   Users can now click the Retry button to reprocess them.')
}

cleanupStuckReceipts()
