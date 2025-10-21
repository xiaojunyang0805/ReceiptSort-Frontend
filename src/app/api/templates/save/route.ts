import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_PRICING, calculateTemplateCost } from '@/lib/template-pricing'

interface SaveTemplateRequest {
  templateName: string
  description?: string
  filePath: string
  fileUrl: string
  fileSize: number
  sheetName: string
  startRow: number
  fieldMapping: Record<string, string>
}

/**
 * POST /api/templates/save
 * Save template configuration and charge credits
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Checks user has enough credits
 * 3. Validates template configuration
 * 4. Charges credits (20 per template)
 * 5. Creates export_templates record
 * 6. Records transaction in template_transactions
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
      filePath,
      fileUrl,
      fileSize,
      sheetName,
      startRow,
      fieldMapping,
    } = body

    // 3. Validate required fields
    if (!templateName || !filePath || !sheetName || !startRow || !fieldMapping) {
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

    // 5. Calculate credit cost
    const creditCost = calculateTemplateCost(templateCount || 0)

    // 6. Check user has enough credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < creditCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: profile?.credits || 0,
        },
        { status: 400 }
      )
    }

    console.log(
      `[Template Save] User has ${profile.credits} credits, charging ${creditCost}`
    )

    // 7. Deduct credits
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - creditCost })
      .eq('id', user.id)

    if (creditError) {
      console.error('[Template Save] Failed to deduct credits:', creditError)
      return NextResponse.json(
        { error: 'Failed to charge credits' },
        { status: 500 }
      )
    }

    // 8. Create export_templates record
    const { data: template, error: templateError } = await supabase
      .from('export_templates')
      .insert({
        user_id: user.id,
        template_name: templateName,
        description: description || null,
        file_path: filePath,
        file_url: fileUrl,
        file_size: fileSize,
        sheet_name: sheetName,
        start_row: startRow,
        field_mapping: fieldMapping,
        credits_spent: creditCost,
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      console.error('[Template Save] Failed to create template:', templateError)

      // Refund credits on failure
      await supabase
        .from('profiles')
        .update({ credits: profile.credits })
        .eq('id', user.id)

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

    // 9. Record transaction
    const { error: transactionError } = await supabase
      .from('template_transactions')
      .insert({
        user_id: user.id,
        template_id: template.id,
        transaction_type: 'create',
        credits_charged: creditCost,
        metadata: {
          template_name: templateName,
          sheet_name: sheetName,
          fields_mapped: Object.keys(fieldMapping).length,
        },
      })

    if (transactionError) {
      console.error('[Template Save] Failed to record transaction:', transactionError)
      // Non-critical error, continue
    }

    console.log(`[Template Save] Template created successfully: ${template.id}`)
    console.log(`[Template Save] Credits charged: ${creditCost}`)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.template_name,
        creditsCharged: creditCost,
        remainingCredits: profile.credits - creditCost,
      },
      message: `Template created successfully. ${creditCost} credits charged.`,
    })
  } catch (error) {
    console.error('[Template Save] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}
