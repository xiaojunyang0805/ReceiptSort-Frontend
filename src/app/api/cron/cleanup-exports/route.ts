import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint will be called by Vercel Cron Jobs
// Configure in vercel.json to run daily

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 30 days retention
const RETENTION_DAYS = 30

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    console.log(`[Cleanup Cron] Starting cleanup of exports older than ${cutoffDate.toISOString()}`)

    // Find old exports
    const { data: oldExports, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .lt('created_at', cutoffDate.toISOString())

    if (fetchError) {
      throw fetchError
    }

    if (!oldExports || oldExports.length === 0) {
      console.log('[Cleanup Cron] No old exports to clean up')
      return NextResponse.json({
        success: true,
        message: 'No old exports to clean up',
        deleted: 0,
      })
    }

    console.log(`[Cleanup Cron] Found ${oldExports.length} old exports`)

    let deletedFiles = 0
    let deletedRecords = 0
    const errors: string[] = []

    // Delete each export
    for (const exportRecord of oldExports) {
      // Delete file from storage
      if (exportRecord.file_path) {
        const { error: storageError } = await supabase.storage
          .from('receipts')
          .remove([exportRecord.file_path])

        if (storageError) {
          console.error(`[Cleanup Cron] Failed to delete file:`, storageError)
          errors.push(`File ${exportRecord.file_path}: ${storageError.message}`)
        } else {
          deletedFiles++
        }
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('exports')
        .delete()
        .eq('id', exportRecord.id)

      if (deleteError) {
        console.error(`[Cleanup Cron] Failed to delete record:`, deleteError)
        errors.push(`Record ${exportRecord.id}: ${deleteError.message}`)
      } else {
        deletedRecords++
      }
    }

    console.log(`[Cleanup Cron] Cleanup complete: ${deletedFiles} files, ${deletedRecords} records deleted`)

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      total: oldExports.length,
      deletedFiles,
      deletedRecords,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('[Cleanup Cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
