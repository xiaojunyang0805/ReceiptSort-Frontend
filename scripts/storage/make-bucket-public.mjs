#!/usr/bin/env node

/**
 * Make the receipts bucket public so export files can be downloaded via public URLs
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

async function makeBucketPublic() {
  console.log('🔧 Making receipts bucket public...\n')

  try {
    const { data, error } = await supabase.storage.updateBucket('receipts', {
      public: true,
      allowedMimeTypes: [
        // Images (existing receipts)
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/tiff',
        'image/bmp',
        'image/gif',
        // PDFs
        'application/pdf',
        // Excel files
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        // CSV files
        'text/csv',
      ],
      fileSizeLimit: 10485760, // 10MB
    })

    if (error) {
      console.error('❌ Failed to update bucket:', error.message)
      console.error('   Details:', JSON.stringify(error, null, 2))
      process.exit(1)
    }

    console.log('✅ Bucket is now public!')
    console.log('\n📋 Configuration:')
    console.log('   - Public: YES')
    console.log('   - Allowed MIME types: Images, PDF, Excel, CSV')
    console.log('   - File size limit: 10 MB')
    console.log('\n⚠️  Note: RLS policies still protect user files')
    console.log('   Users can only access their own receipts and exports')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

makeBucketPublic()
