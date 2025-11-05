#!/usr/bin/env node

/**
 * Direct API test - simulates exactly what the frontend does
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEMPLATE_PATH = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'SeeNano_Declaration form  2025_Q4 Oct.xlsx')

async function testAPIDirect() {
  console.log('=== Direct API Test ===\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get user and receipts
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', '601404242@qq.com')

  if (!users || users.length === 0) {
    console.error('User not found')
    return
  }

  const user = users[0]

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user.id)
    .eq('processing_status', 'completed')

  if (!receipts || receipts.length === 0) {
    console.error('No completed receipts')
    return
  }

  console.log(`✓ User: ${user.email}`)
  console.log(`✓ Receipts: ${receipts.length}`)
  console.log(`✓ Receipt IDs:`, receipts.map(r => r.id))
  console.log()

  // Read and encode template
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH)
  const base64 = templateBuffer.toString('base64')

  console.log(`✓ Template loaded: ${path.basename(TEMPLATE_PATH)}`)
  console.log(`  Size: ${templateBuffer.length} bytes`)
  console.log(`  Base64 length: ${base64.length}`)
  console.log()

  // Prepare request body (exactly like frontend)
  const requestBody = {
    receipt_ids: receipts.map(r => r.id),
    template_file: base64,
    sheet_name: 'Purchase or Expense  ',  // with trailing spaces
    start_row: 2,
    field_mapping: {
      'invoice_number': 'A',
      'merchant_name': 'B',
      'receipt_date': 'C',
      'total_amount': 'G',
      'subtotal': 'E',
      'tax_amount': 'F',
      'currency': 'H',
      'category': 'I',
      'payment_method': 'K',
      'vendor_tax_id': 'J'
    },
    save_for_reuse: true,
    template_name: 'Test Template API Direct'
  }

  console.log('--- Making API Request ---')
  console.log(`POST /api/export/smart-template`)
  console.log(`Body size: ${JSON.stringify(requestBody).length} bytes`)
  console.log()

  try {
    // Create auth session
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: '601404242@qq.com',
      password: 'test123'  // You'll need to set this
    })

    if (authError) {
      console.error('❌ Auth failed:', authError.message)
      console.log('\nℹ️  Set password first with:')
      console.log('   supabase.auth.admin.updateUserById(user_id, { password: "test123" })')
      return
    }

    console.log('✓ Authenticated')
    console.log()

    // Call API
    const response = await fetch('http://localhost:3000/api/export/smart-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`Response status: ${response.status} ${response.statusText}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    console.log(`Content-Length: ${response.headers.get('content-length')}`)
    console.log()

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:')
      console.error(errorText)
      return
    }

    // Save response
    const buffer = await response.arrayBuffer()
    const outputPath = path.join(__dirname, '..', 'tests', 'ExportTemplate', 'API_TEST_OUTPUT.xlsx')
    fs.writeFileSync(outputPath, Buffer.from(buffer))

    console.log(`✅ Success!`)
    console.log(`   File saved: ${outputPath}`)
    console.log(`   Size: ${buffer.byteLength} bytes`)
    console.log()
    console.log('Try opening API_TEST_OUTPUT.xlsx to verify it works')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

testAPIDirect().catch(console.error)
