#!/usr/bin/env node
/**
 * Check Stuck Receipts Script
 *
 * Identifies receipts stuck in "processing" status and provides diagnostic information
 *
 * Usage: node scripts/debugging/check-stuck-receipts.mjs
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

async function checkStuckReceipts() {
  console.log('🔍 Checking for stuck receipts...\n')
  console.log('━'.repeat(80))

  try {
    // Find all receipts stuck in "processing" status
    const { data: stuckReceipts, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('processing_status', 'processing')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!stuckReceipts || stuckReceipts.length === 0) {
      console.log('✅ No stuck receipts found! All receipts are either pending, completed, or failed.')
      console.log('━'.repeat(80))
      return
    }

    console.log(`\n⚠️  Found ${stuckReceipts.length} receipt(s) stuck in "processing" status:\n`)

    for (const receipt of stuckReceipts) {
      const createdAt = new Date(receipt.created_at)
      const updatedAt = new Date(receipt.updated_at)
      const now = new Date()
      const stuckMinutes = Math.floor((now - updatedAt) / 1000 / 60)

      console.log('━'.repeat(80))
      console.log(`📄 Receipt ID: ${receipt.id}`)
      console.log(`   File Name: ${receipt.file_name}`)
      console.log(`   File Type: ${receipt.file_type}`)
      console.log(`   File Size: ${(receipt.file_size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`   User ID: ${receipt.user_id}`)
      console.log(`   Status: ${receipt.processing_status}`)
      console.log(`   Created: ${createdAt.toISOString()}`)
      console.log(`   Updated: ${updatedAt.toISOString()}`)
      console.log(`   ⏱️  Stuck for: ${stuckMinutes} minutes`)

      if (receipt.processing_error) {
        console.log(`   ❌ Error: ${receipt.processing_error}`)
      }

      if (receipt.confidence_score !== null) {
        console.log(`   📊 Confidence: ${(receipt.confidence_score * 100).toFixed(0)}%`)
      }

      // Check if it's a medical invoice from Yang
      if (receipt.file_name.includes('IMG_20251104_093')) {
        console.log(`   🏥 Medical Invoice: YES (Yang medical invoice)`)
      }

      console.log('')
    }

    console.log('━'.repeat(80))
    console.log('\n📋 Summary:')
    console.log(`   Total stuck: ${stuckReceipts.length}`)
    console.log(`   File types: ${[...new Set(stuckReceipts.map(r => r.file_type))].join(', ')}`)

    const avgStuckTime = stuckReceipts.reduce((sum, r) => {
      return sum + (new Date() - new Date(r.updated_at))
    }, 0) / stuckReceipts.length / 1000 / 60

    console.log(`   Avg stuck time: ${avgStuckTime.toFixed(0)} minutes`)

    console.log('\n💡 Recommendations:')
    console.log('   1. Check if OpenAI API key is configured correctly')
    console.log('   2. Check if there are any API rate limits being hit')
    console.log('   3. Review server logs for processing errors')
    console.log('   4. Consider resetting stuck receipts to "failed" or "pending" status')
    console.log('\n📝 To reset stuck receipts to "failed" status:')
    console.log('   Run: node scripts/debugging/reset-stuck-receipts.mjs')

    console.log('━'.repeat(80))
    console.log('')

  } catch (error) {
    console.error('❌ Error checking stuck receipts:', error)
    process.exit(1)
  }
}

checkStuckReceipts()
