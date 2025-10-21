import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_PRICING, validateTemplateFile } from '@/lib/template-pricing'

/**
 * POST /api/templates/upload
 * Upload a new export template file
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Checks template quota (max 10)
 * 3. Validates file (size, type)
 * 4. Uploads file to Supabase Storage
 * 5. Returns file path and URL for next step (configuration)
 *
 * Note: Credits are NOT charged here - only on final save with configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Template Upload] User ${user.id} uploading template`)

    // 2. Check template quota
    const { data: quota, error: quotaError } = await supabase
      .from('user_template_quota')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!quotaError && quota) {
      if (quota.templates_created >= quota.max_templates) {
        return NextResponse.json(
          {
            error: `Template limit reached. Maximum ${quota.max_templates} templates allowed.`,
            quota: {
              used: quota.templates_created,
              max: quota.max_templates,
            },
          },
          { status: 400 }
        )
      }
    }

    // Get current template count from export_templates table
    const { count: templateCount } = await supabase
      .from('export_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (templateCount !== null && templateCount >= TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER) {
      return NextResponse.json(
        {
          error: `Template limit reached. Maximum ${TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER} templates allowed.`,
          quota: {
            used: templateCount,
            max: TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER,
          },
        },
        { status: 400 }
      )
    }

    // 3. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 4. Validate file
    const validation = validateTemplateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    console.log(`[Template Upload] File validated: ${file.name} (${file.size} bytes)`)

    // 5. Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.id}/templates/${timestamp}_${sanitizedFileName}`

    // 6. Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Template Upload] Upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload template file' },
        { status: 500 }
      )
    }

    // 7. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('receipts').getPublicUrl(filePath)

    console.log(`[Template Upload] File uploaded successfully: ${filePath}`)

    // 8. Return file info for configuration step
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        path: filePath,
        url: publicUrl,
      },
      message: 'Template file uploaded. Please configure mapping.',
    })
  } catch (error) {
    console.error('[Template Upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to upload template' },
      { status: 500 }
    )
  }
}
