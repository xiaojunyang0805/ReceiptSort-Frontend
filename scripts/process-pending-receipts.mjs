#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function processPendingReceipts() {
  const userEmail = 'xiaojunyang0805@gmail.com'

  // Get user
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', userEmail)

  if (!users || users.length === 0) {
    console.log('User not found')
    return
  }

  const userId = users[0].id

  // Get pending receipts
  const { data: pendingReceipts, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\nFound ${pendingReceipts.length} pending receipts\n`)

  for (const receipt of pendingReceipts) {
    console.log(`Processing: ${receipt.id} - ${receipt.merchant_name || 'Unnamed'}`)
    console.log(`  Status: ${receipt.status}`)
    console.log(`  Has extracted data: ${receipt.merchant_name ? 'YES' : 'NO'}`)

    // Check if receipt already has extracted data
    if (receipt.merchant_name && receipt.total_amount) {
      console.log(`  ✓ Receipt already has data, marking as completed...`)

      const { error: updateError } = await supabase
        .from('receipts')
        .update({ status: 'completed' })
        .eq('id', receipt.id)

      if (updateError) {
        console.error(`  ✗ Error updating:`, updateError)
      } else {
        console.log(`  ✓ Marked as completed`)
      }
    } else {
      console.log(`  ! Receipt needs processing - trigger /api/receipts/${receipt.id}/process`)
    }
    console.log()
  }
}

processPendingReceipts()
