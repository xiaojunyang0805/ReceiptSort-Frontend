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

async function debugUserExport() {
  const userEmail = 'xiaojunyang0805@gmail.com'

  console.log('=== Debugging Export for:', userEmail, '===\n')

  // 1. Get user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', userEmail)

  if (userError) {
    console.error('Error fetching user:', userError)
    return
  }

  if (!users || users.length === 0) {
    console.log('User not found. Checking auth.users table...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return
    }

    const authUser = authUsers.users.find(u => u.email === userEmail)
    if (authUser) {
      console.log('Found in auth.users:', authUser.id, authUser.email)
      console.log('But NOT in profiles table - this is the issue!')
    }
    return
  }

  const user = users[0]
  console.log('✓ User found:', user.id)
  console.log('  Email:', user.email)
  console.log('  Credits:', user.credits)
  console.log()

  // 2. Get receipts
  const { data: receipts, error: receiptsError } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10)

  if (receiptsError) {
    console.error('Error fetching receipts:', receiptsError)
  } else {
    console.log(`✓ Found ${receipts.length} completed receipts`)
    if (receipts.length > 0) {
      console.log('  Most recent:', receipts[0].id, '-', receipts[0].merchant_name)
    }
  }
  console.log()

  // 3. Get export templates
  const { data: templates, error: templatesError } = await supabase
    .from('export_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (templatesError) {
    console.error('Error fetching templates:', templatesError)
  } else {
    console.log(`✓ Found ${templates?.length || 0} saved templates`)
    if (templates && templates.length > 0) {
      templates.forEach(t => {
        console.log(`  - ${t.template_name} (${t.sheet_name}, row ${t.start_row})`)
        console.log(`    Fields: ${Object.keys(t.field_mapping).length}`)
        console.log(`    Created: ${new Date(t.created_at).toLocaleString()}`)
      })
    }
  }
  console.log()

  // 4. Get credit transactions
  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (txError) {
    console.error('Error fetching transactions:', txError)
  } else {
    console.log(`✓ Found ${transactions?.length || 0} recent transactions`)
    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        console.log(`  ${t.created_at}: ${t.amount > 0 ? '+' : ''}${t.amount} credits - ${t.description}`)
      })
    }
  }
  console.log()

  // 5. Check for export records (if table exists)
  const { data: exports, error: exportsError } = await supabase
    .from('exports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (exportsError) {
    if (exportsError.message.includes('does not exist')) {
      console.log('ℹ  exports table does not exist (this is OK if not using export history)')
    } else {
      console.error('Error fetching exports:', exportsError)
    }
  } else {
    console.log(`✓ Found ${exports?.length || 0} export records`)
    if (exports && exports.length > 0) {
      exports.forEach(e => {
        console.log(`  ${e.created_at}: ${e.export_type} - ${e.receipt_count} receipts`)
      })
    }
  }
}

debugUserExport()
