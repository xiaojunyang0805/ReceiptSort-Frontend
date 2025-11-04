#!/usr/bin/env node

/**
 * Check Supabase Storage permissions and test upload
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage configuration...\n')

  // Check if receipts bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.error('❌ Failed to list buckets:', bucketsError)
    process.exit(1)
  }

  const receiptsBucket = buckets.find(b => b.name === 'receipts')
  if (!receiptsBucket) {
    console.error('❌ "receipts" bucket not found!')
    console.log('Available buckets:', buckets.map(b => b.name).join(', '))
    process.exit(1)
  }

  console.log('✅ "receipts" bucket exists')
  console.log('   Public:', receiptsBucket.public)
  console.log('   ID:', receiptsBucket.id)
  console.log('')

  // Test upload with service role using Excel mime type
  console.log('🧪 Testing file upload with Excel mime type...')
  const testFilePath = '90123fcc-52ef-4895-aa1b-959318f5358a/exports/test-upload.xlsx'
  const testContent = 'Test file upload - ' + new Date().toISOString()

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(testFilePath, testContent, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    })

  if (uploadError) {
    console.error('❌ Upload failed!')
    console.error('   Error:', uploadError.message)
    console.error('   Details:', JSON.stringify(uploadError, null, 2))
    console.log('')
    console.log('💡 Possible issues:')
    console.log('   1. Storage bucket RLS policies blocking uploads')
    console.log('   2. Service role key not configured correctly')
    console.log('   3. Storage bucket not public or missing policies')
  } else {
    console.log('✅ Upload successful!')
    console.log('   Path:', uploadData.path)
    console.log('')

    // Test download
    console.log('🧪 Testing file download...')
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(testFilePath)

    if (downloadError) {
      console.error('❌ Download failed:', downloadError.message)
    } else {
      console.log('✅ Download successful!')
      console.log('   Size:', downloadData.size, 'bytes')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(testFilePath)

    console.log('')
    console.log('📎 Public URL:', publicUrl)
    console.log('')
    console.log('✅ Storage is working correctly!')

    // Cleanup test file
    await supabase.storage.from('receipts').remove([testFilePath])
  }
}

checkStorage()
