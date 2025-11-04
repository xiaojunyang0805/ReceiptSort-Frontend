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

async function checkAllReceipts() {
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

  // Get ALL receipts (any status)
  const { data: allReceipts, error } = await supabase
    .from('receipts')
    .select('id, merchant_name, status, created_at, total_amount')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\n=== ALL RECEIPTS for ${userEmail} ===\n`)
  console.log(`Total receipts: ${allReceipts.length}`)

  if (allReceipts.length === 0) {
    console.log('\nNo receipts found at all!')
    return
  }

  const byStatus = {}
  allReceipts.forEach(r => {
    if (!byStatus[r.status]) byStatus[r.status] = []
    byStatus[r.status].push(r)
  })

  console.log('\nBreakdown by status:')
  Object.entries(byStatus).forEach(([status, receipts]) => {
    console.log(`  ${status}: ${receipts.length}`)
  })

  console.log('\nReceipt details:')
  allReceipts.slice(0, 10).forEach(r => {
    console.log(`  [${r.status}] ${r.merchant_name || 'No name'} - ${r.total_amount || 0} - ${new Date(r.created_at).toLocaleString()}`)
  })
}

checkAllReceipts()
