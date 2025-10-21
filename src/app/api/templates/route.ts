import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/templates
 * List all templates for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's templates
    const { data: templates, error: fetchError } = await supabase
      .from('export_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[Templates List] Failed to fetch templates:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    // Get quota info
    const { data: quota } = await supabase
      .from('user_template_quota')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      templates: templates || [],
      quota: {
        used: templates?.length || 0,
        max: quota?.max_templates || 10,
        remaining: Math.max(0, (quota?.max_templates || 10) - (templates?.length || 0)),
      },
    })
  } catch (error) {
    console.error('[Templates List] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates?id=xxx
 * Delete a template (soft delete - mark as inactive)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get template ID from query params
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Template Delete] User ${user.id} deleting template ${templateId}`)

    // Get template to check ownership and get file path
    const { data: template, error: fetchError } = await supabase
      .from('export_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Soft delete: Mark as inactive
    const { error: deleteError } = await supabase
      .from('export_templates')
      .update({ is_active: false })
      .eq('id', templateId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[Template Delete] Failed to delete template:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    // Delete file from storage
    if (template.file_path) {
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([template.file_path])

      if (storageError) {
        console.error('[Template Delete] Failed to delete file from storage:', storageError)
        // Non-critical, continue
      }
    }

    // Record transaction
    await supabase.from('template_transactions').insert({
      user_id: user.id,
      template_id: templateId,
      transaction_type: 'delete',
      credits_charged: 0, // No charge for deletion
      metadata: {
        template_name: template.template_name,
      },
    })

    console.log(`[Template Delete] Template deleted successfully: ${templateId}`)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('[Template Delete] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
