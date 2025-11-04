#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTemplateSave() {
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

  console.log('=== Template Save Check ===\n')
  console.log(`User: ${user.email}`)
  console.log(`User ID: ${user.id}`)
  console.log(`Current Credits: ${user.credits}`)
  console.log()

  // Check all templates for this user
  const { data: templates, error: templatesError } = await supabase
    .from('export_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (templatesError) {
    console.error('Error fetching templates:', templatesError)
  } else {
    console.log(`Saved Templates: ${templates?.length || 0}`)
    if (templates && templates.length > 0) {
      templates.forEach(t => {
        console.log(`\n  Template: ${t.template_name}`)
        console.log(`  Created: ${t.created_at}`)
        console.log(`  Sheet: ${t.sheet_name}`)
        console.log(`  Start Row: ${t.start_row}`)
        console.log(`  File Path: ${t.file_path}`)
        console.log(`  Field Mapping:`, Object.keys(t.field_mapping || {}))
      })
    }
  }

  console.log()

  // Check credit transactions in last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })

  console.log(`\nCredit Transactions (last 24 hours): ${transactions?.length || 0}`)
  if (transactions && transactions.length > 0) {
    transactions.forEach(t => {
      console.log(`  ${t.created_at}: ${t.amount} credits - ${t.description}`)
    })
  }
}

checkTemplateSave().catch(console.error)
