#!/usr/bin/env node

/**
 * Add file storage columns to exports table
 *
 * This migration adds:
 * - file_path: TEXT - Path in Supabase Storage
 * - file_url: TEXT - Public download URL
 *
 * To run: node scripts/run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColumns() {
  console.log('🔄 Checking exports table schema...\n')

  try {
    // First, check if the columns already exist
    const { data: existingExports, error: selectError } = await supabase
      .from('exports')
      .select('*')
      .limit(1)

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError
    }

    if (existingExports && existingExports.length > 0) {
      const firstExport = existingExports[0]
      if ('file_path' in firstExport && 'file_url' in firstExport) {
        console.log('✅ Columns already exist!')
        console.log('   - file_path: exists')
        console.log('   - file_url: exists')
        return
      }
    }

    console.log('ℹ️  Columns need to be added.')
    console.log('\n📝 Manual Migration Required:')
    console.log('   Please run the following SQL in your Supabase SQL Editor:\n')
    console.log('   ALTER TABLE exports ADD COLUMN IF NOT EXISTS file_path TEXT;')
    console.log('   ALTER TABLE exports ADD COLUMN IF NOT EXISTS file_url TEXT;')
    console.log('   CREATE INDEX IF NOT EXISTS idx_exports_created_at ON exports(created_at DESC);')
    console.log('\n   Or use the migration file: supabase/migrations/20251021_add_export_file_storage.sql')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

addColumns()
