#!/usr/bin/env node

/**
 * Cleanup script for old export files
 *
 * This script:
 * 1. Finds all export records older than 30 days
 * 2. Deletes the files from Supabase Storage
 * 3. Deletes the database records
 *
 * This should be run as a cron job daily.
 * Recommended: Run at 2 AM daily
 *
 * To run manually: node scripts/cleanup-old-exports.mjs
 * To run as cron (example): 0 2 * * * cd /path/to/project && node scripts/cleanup-old-exports.mjs
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

// 30 days ago
const RETENTION_DAYS = 30
const cutoffDate = new Date()
cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

async function cleanupOldExports() {
  console.log('🧹 Starting cleanup of old export files...')
  console.log(`📅 Deleting exports older than ${RETENTION_DAYS} days (before ${cutoffDate.toISOString()})`)
  console.log('')

  try {
    // 1. Find old export records
    const { data: oldExports, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .lt('created_at', cutoffDate.toISOString())

    if (fetchError) {
      throw fetchError
    }

    if (!oldExports || oldExports.length === 0) {
      console.log('✅ No old exports to clean up')
      return
    }

    console.log(`📦 Found ${oldExports.length} old export(s) to delete`)
    console.log('')

    let deletedFiles = 0
    let deletedRecords = 0
    let errors = 0

    // 2. Delete each file from storage and database
    for (const exportRecord of oldExports) {
      console.log(`   Processing: ${exportRecord.file_name} (${exportRecord.id})`)

      // Delete file from storage if it exists
      if (exportRecord.file_path) {
        const { error: storageError } = await supabase.storage
          .from('receipts')
          .remove([exportRecord.file_path])

        if (storageError) {
          console.error(`   ❌ Failed to delete file from storage:`, storageError.message)
          errors++
        } else {
          console.log(`   ✓ Deleted file from storage`)
          deletedFiles++
        }
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('exports')
        .delete()
        .eq('id', exportRecord.id)

      if (deleteError) {
        console.error(`   ❌ Failed to delete database record:`, deleteError.message)
        errors++
      } else {
        console.log(`   ✓ Deleted database record`)
        deletedRecords++
      }

      console.log('')
    }

    // 3. Summary
    console.log('═══════════════════════════════════════════════')
    console.log('📊 Cleanup Summary:')
    console.log(`   Total old exports found: ${oldExports.length}`)
    console.log(`   Files deleted: ${deletedFiles}`)
    console.log(`   Database records deleted: ${deletedRecords}`)
    if (errors > 0) {
      console.log(`   ⚠️  Errors encountered: ${errors}`)
    } else {
      console.log(`   ✅ No errors`)
    }
    console.log('═══════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupOldExports()
  .then(() => {
    console.log('')
    console.log('✅ Cleanup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
