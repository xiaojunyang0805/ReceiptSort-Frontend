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

async function testExportIssue() {
  const userEmail = '601404242@qq.com'

  console.log('=== Testing Export Issue ===\n')

  // Get user
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', userEmail)

  if (!users || users.length === 0) {
    console.log('❌ User not found:', userEmail)
    console.log('\nLet me check xiaojunyang0805@gmail.com instead...\n')

    const { data: altUsers } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', 'xiaojunyang0805@gmail.com')

    if (!altUsers || altUsers.length === 0) {
      console.log('❌ Neither user found')
      return
    }

    const userId = altUsers[0].id
    console.log('✓ Using xiaojunyang0805@gmail.com:', userId)
    await checkUser(userId, 'xiaojunyang0805@gmail.com')
  } else {
    const userId = users[0].id
    console.log('✓ Found user:', userEmail, '-', userId)
    await checkUser(userId, userEmail)
  }
}

async function checkUser(userId, email) {
  console.log('\n--- Checking Receipts ---')

  // Get completed receipts
  const { data: receipts, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${receipts.length} completed receipts`)

  if (receipts.length > 0) {
    console.log('\nReceipt details:')
    receipts.slice(0, 5).forEach(r => {
      console.log(`  ${r.id}`)
      console.log(`    Merchant: ${r.merchant_name || 'N/A'}`)
      console.log(`    Amount: ${r.total_amount || 0} ${r.currency || 'EUR'}`)
      console.log(`    Date: ${r.receipt_date || 'N/A'}`)
      console.log(`    Invoice: ${r.invoice_number || 'N/A'}`)
      console.log(`    Subtotal: ${r.subtotal || 'N/A'}`)
      console.log(`    Tax: ${r.tax_amount || 'N/A'}`)
      console.log(`    Category: ${r.category || 'N/A'}`)
      console.log(`    Payment: ${r.payment_method || 'N/A'}`)
      console.log(`    Vendor Tax ID: ${r.vendor_tax_id || 'N/A'}`)
      console.log()
    })
  }

  console.log('\n--- Checking Saved Templates ---')

  const { data: templates, error: tErr } = await supabase
    .from('export_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (tErr) {
    console.error('Error:', tErr)
  } else {
    console.log(`Found ${templates?.length || 0} saved templates`)

    if (templates && templates.length > 0) {
      templates.forEach(t => {
        console.log(`\n  Template: ${t.template_name}`)
        console.log(`    Sheet: ${t.sheet_name}`)
        console.log(`    Start Row: ${t.start_row}`)
        console.log(`    Field Mapping: ${JSON.stringify(t.field_mapping, null, 2)}`)
        console.log(`    File Path: ${t.file_path}`)
        console.log(`    Created: ${t.created_at}`)
      })
    }
  }
}

testExportIssue()
