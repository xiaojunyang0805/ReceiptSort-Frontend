import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_PRICING, calculateTemplateCost } from '@/lib/template-pricing'

interface SaveTemplateRequest {
  templateName: string
  description?: string
  filePath?: string
  fileUrl?: string
  fileSize?: number
  sheetName: string
  startRow: number
  fieldMapping: Record<string, string>
  templateFile?: string // base64 encoded file for auto-save
}

/**
 * POST /api/templates/save
 * Save template configuration (FREE - no credit charge)
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Validates template configuration
 * 3. Checks template quota (max 10)
 * 4. Uploads file if provided (base64)
 * 5. Creates export_templates record (FREE)
 * 6. No credit charge - saving templates is free
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

    // 2. Parse request body
    const body: SaveTemplateRequest = await request.json()
    const {
      templateName,
      description,
      filePath: providedFilePath,
      fileUrl: providedFileUrl,
      fileSize: providedFileSize,
      sheetName,
      startRow,
      fieldMapping,
      templateFile,
    } = body

    // 3. Validate required fields
    if (!templateName || !sheetName || !startRow || !fieldMapping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (startRow < 1) {
      return NextResponse.json(
        { error: 'Start row must be at least 1' },
        { status: 400 }
      )
    }

    if (Object.keys(fieldMapping).length === 0) {
      return NextResponse.json(
        { error: 'At least one field mapping is required' },
        { status: 400 }
      )
    }

    console.log(`[Template Save] User ${user.id} saving template: ${templateName}`)

    // 4. Check template quota
    const { count: templateCount } = await supabase
      .from('export_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (templateCount !== null && templateCount >= TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER) {
      return NextResponse.json(
        {
          error: `Template limit reached. Maximum ${TEMPLATE_PRICING.MAX_TEMPLATES_PER_USER} templates allowed.`,
        },
        { status: 400 }
      )
    }

    // 5. Upload file if provided (for auto-save)
    let filePath = providedFilePath
    let fileUrl = providedFileUrl
    let fileSize = providedFileSize

    if (templateFile) {
      console.log(`[Template Save] Uploading template file...`)
      const templateBuffer = Buffer.from(templateFile, 'base64')
      const fileName = `${user.id}/templates/${Date.now()}_${templateName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, templateBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: false,
        })

      if (uploadError) {
        console.error('[Template Save] Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload template file' },
          { status: 500 }
        )
      }

      filePath = fileName
      fileSize = templateBuffer.length

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)
      fileUrl = publicUrl

      console.log(`[Template Save] File uploaded: ${fileName}`)
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 6. Create export_templates record (FREE - no credit charge)
    const { data: template, error: templateError } = await supabase
      .from('export_templates')
      .insert({
        user_id: user.id,
        template_name: templateName,
        description: description || null,
        file_path: filePath,
        file_url: fileUrl || null,
        file_size: fileSize || null,
        sheet_name: sheetName,
        start_row: startRow,
        field_mapping: fieldMapping,
        credits_spent: 0, // FREE - saving templates costs 0 credits
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      console.error('[Template Save] Failed to create template:', templateError)

      // Check for unique constraint violation
      if (templateError.code === '23505') {
        return NextResponse.json(
          { error: 'A template with this name already exists' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to save template' },
        { status: 500 }
      )
    }

    console.log(`[Template Save] Template created successfully: ${template.id} (FREE - no credits charged)`)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.template_name,
        creditsCharged: 0,
      },
      message: `Template saved successfully (FREE)`,
    })
  } catch (error) {
    console.error('[Template Save] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}
