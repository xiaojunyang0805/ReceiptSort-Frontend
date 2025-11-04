#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLatest() {
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', 'xiaojunyang0805@gmail.com')

  if (!users || users.length === 0) return

  const user = users[0]

  console.log('=== Latest Activity ===\n')
  console.log(`User: ${user.email}`)
  console.log(`Credits: ${user.credits}\n`)

  // All transactions
  const { data: allTransactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('Last 10 Transactions:')
  allTransactions?.forEach(t => {
    const date = new Date(t.created_at)
    const timeAgo = Math.round((Date.now() - date.getTime()) / 1000 / 60)
    console.log(`  ${date.toLocaleString()} (${timeAgo}min ago)`)
    console.log(`    ${t.amount > 0 ? '+' : ''}${t.amount} credits - ${t.description}`)
  })
}

checkLatest().catch(console.error)
