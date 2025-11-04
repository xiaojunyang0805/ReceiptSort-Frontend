#!/usr/bin/env node

/**
 * Check the most recent export record to debug file_url issue
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

async function checkExport() {
  console.log('🔍 Checking most recent export record...\n')

  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('No exports found')
    return
  }

  const exportRecord = data[0]
  console.log('📄 Most Recent Export:')
  console.log('  ID:', exportRecord.id)
  console.log('  Type:', exportRecord.export_type)
  console.log('  File Name:', exportRecord.file_name)
  console.log('  File Path:', exportRecord.file_path || '❌ NULL')
  console.log('  File URL:', exportRecord.file_url || '❌ NULL')
  console.log('  Created:', exportRecord.created_at)
  console.log('  Receipt Count:', exportRecord.receipt_count)
  console.log('')

  if (!exportRecord.file_url) {
    console.log('⚠️  File URL is missing!')
    console.log('This export was created before file storage was added,')
    console.log('or the file upload failed during export.')
  } else {
    console.log('✅ File URL exists:', exportRecord.file_url)
  }
}

checkExport()
