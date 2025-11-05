#!/usr/bin/env node

/**
 * Test if the export file URL is accessible
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

async function testDownload() {
  console.log('🔍 Testing export download URL...\n')

  // Get the most recent export
  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    console.error('❌ No exports found')
    process.exit(1)
  }

  const exportRecord = data[0]
  console.log('📄 Export Record:')
  console.log('  File Name:', exportRecord.file_name)
  console.log('  File Path:', exportRecord.file_path)
  console.log('  File URL:', exportRecord.file_url)
  console.log('')

  if (!exportRecord.file_url) {
    console.log('❌ No file URL!')
    process.exit(1)
  }

  // Test if file exists in storage
  console.log('📦 Checking if file exists in storage...')
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('receipts')
    .download(exportRecord.file_path)

  if (downloadError) {
    console.error('❌ File not found in storage!')
    console.error('   Error:', downloadError.message)
    console.log('')
    console.log('💡 This means the file was never uploaded to storage.')
    console.log('   The export API might have failed to upload the file.')
  } else {
    console.log('✅ File exists in storage!')
    console.log('   Size:', fileData.size, 'bytes')
    console.log('   Type:', fileData.type)
    console.log('')
    console.log('✅ File URL should work:', exportRecord.file_url)
    console.log('')
    console.log('🧪 Test the URL in your browser or with curl:')
    console.log(`   curl -I "${exportRecord.file_url}"`)
  }
}

testDownload()
