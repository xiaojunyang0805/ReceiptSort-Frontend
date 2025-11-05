#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkActivity() {
  const userEmail = 'xiaojunyang0805@gmail.com'

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, credits')
    .ilike('email', userEmail)

  if (!users || users.length === 0) {
    console.log('User not found')
    return
  }

  const user = users[0]

  console.log('=== Recent Activity ===\n')
  console.log(`User: ${user.email}`)
  console.log(`Current Credits: ${user.credits}`)
  console.log()

  // Check credit transactions in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  console.log(`Credit Transactions (last hour): ${transactions?.length || 0}`)
  if (transactions && transactions.length > 0) {
    transactions.forEach(t => {
      console.log(`  ${t.created_at}: ${t.amount} credits - ${t.description}`)
    })
  }
  console.log()

  // Check export records in last hour
  const { data: exports } = await supabase
    .from('exports')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  console.log(`Export Records (last hour): ${exports?.length || 0}`)
  if (exports && exports.length > 0) {
    exports.forEach(e => {
      console.log(`  ${e.created_at}: ${e.export_type} - ${e.receipt_count} receipts - ${e.file_size} bytes`)
    })
  }
  console.log()

  // Check saved templates
  const { data: templates } = await supabase
    .from('export_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false})

  console.log(`Saved Templates: ${templates?.length || 0}`)
  if (templates && templates.length > 0) {
    templates.forEach(t => {
      console.log(`  ${t.template_name} - created: ${t.created_at}`)
    })
  }
}

checkActivity().catch(console.error)
