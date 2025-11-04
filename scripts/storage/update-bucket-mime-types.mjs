#!/usr/bin/env node

/**
 * Update the receipts bucket to allow Excel and CSV file uploads
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

async function updateBucket() {
  console.log('🔧 Updating receipts bucket to allow Excel and CSV files...\n')

  try {
    // Update bucket with allowed MIME types
    const { data, error } = await supabase.storage.updateBucket('receipts', {
      public: false,
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

    console.log('✅ Bucket updated successfully!')
    console.log('\n📋 Allowed MIME types:')
    console.log('   - Images: PNG, JPEG, WebP, TIFF, BMP, GIF')
    console.log('   - Documents: PDF')
    console.log('   - Exports: Excel (.xlsx, .xls), CSV')
    console.log('\n📏 File size limit: 10 MB')
    console.log('\n🎉 You can now upload export files to storage!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

updateBucket()
