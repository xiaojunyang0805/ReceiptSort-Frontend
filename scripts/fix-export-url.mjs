#!/usr/bin/env node

/**
 * Fix the file_url for the most recent export
 * Generate the public URL from the existing file_path
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

async function fixExportUrl() {
  console.log('🔧 Fixing export file URLs...\n')

  // Get exports with file_path but no file_url
  const { data: exports, error } = await supabase
    .from('exports')
    .select('*')
    .not('file_path', 'is', null)
    .is('file_url', null)

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  if (!exports || exports.length === 0) {
    console.log('✅ No exports need fixing')
    return
  }

  console.log(`📦 Found ${exports.length} export(s) to fix\n`)

  for (const exportRecord of exports) {
    console.log(`Processing: ${exportRecord.file_name}`)
    console.log(`  File Path: ${exportRecord.file_path}`)

    // Generate public URL from file_path
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(exportRecord.file_path)

    console.log(`  Public URL: ${publicUrl}`)

    // Update the database record
    const { error: updateError } = await supabase
      .from('exports')
      .update({ file_url: publicUrl })
      .eq('id', exportRecord.id)

    if (updateError) {
      console.error(`  ❌ Failed to update:`, updateError.message)
    } else {
      console.log(`  ✅ Updated successfully`)
    }
    console.log('')
  }

  console.log('✅ All exports fixed!')
}

fixExportUrl()
