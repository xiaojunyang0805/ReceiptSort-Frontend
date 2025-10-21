import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import ExcelJS from 'exceljs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/templates/analyze
 * AI-powered template analysis - detects structure and suggests field mappings
 */
export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[Template Analyze] Processing file:', file.name)

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    // Get first sheet (most templates have data on first sheet)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json({ error: 'No worksheets found in file' }, { status: 400 })
    }

    // Extract header rows and sample data for AI analysis
    const headers: string[] = []
    const sampleData: string[][] = []

    // Get first 5 rows to analyze structure
    for (let rowNum = 1; rowNum <= Math.min(10, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum)
      const rowData: string[] = []

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 20) { // Only analyze first 20 columns
          rowData.push(cell.text || '')
        }
      })

      sampleData.push(rowData)

      // Try to detect header row (row with most non-empty cells)
      if (rowData.filter(cell => cell.trim()).length > headers.filter(h => h.trim()).length) {
        headers.length = 0
        headers.push(...rowData)
      }
    }

    console.log('[Template Analyze] Detected headers:', headers.slice(0, 10))

    // Call GPT-4 to analyze the template structure
    const analysisPrompt = `You are analyzing an Excel template for receipt data export.

Template Structure:
- Sheet Name: ${worksheet.name}
- Headers detected: ${JSON.stringify(headers.filter(h => h.trim()))}
- Sample rows (first 5):
${sampleData.slice(0, 5).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row.filter(c => c.trim()))}`).join('\n')}

Receipt fields available for mapping:
- invoice_number: Invoice/receipt number
- merchant_name: Name of merchant/vendor
- receipt_date: Date of purchase (format: YYYY-MM-DD)
- total_amount: Total amount paid
- subtotal: Amount before tax
- tax_amount: Tax/VAT amount
- currency: Currency code (e.g., EUR, USD)
- category: Expense category
- payment_method: How payment was made
- vendor_tax_id: Vendor's tax ID (VAT number)

Based on the template structure, provide:
1. Which row number should be the START ROW for data insertion (where actual data begins, not headers)
2. Suggested field mappings (which receipt field should go in which column)
3. Confidence score (0-100) for each mapping

Return ONLY valid JSON in this exact format:
{
  "sheetName": "${worksheet.name}",
  "startRow": <number>,
  "suggestedMappings": {
    "<receipt_field>": {
      "column": "<column_letter>",
      "confidence": <0-100>,
      "reason": "<brief explanation>"
    }
  },
  "analysis": "<overall analysis of the template>"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing Excel templates and mapping data fields. Always return valid JSON.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    const analysisResult = JSON.parse(aiResponse)

    console.log('[Template Analyze] AI analysis result:', analysisResult)

    // Convert suggested mappings to the format expected by frontend
    const fieldMapping: Record<string, string> = {}
    for (const [field, mapping] of Object.entries(analysisResult.suggestedMappings || {})) {
      const mappingData = mapping as { column: string; confidence: number }
      if (mappingData.confidence >= 60) { // Only include high-confidence mappings
        fieldMapping[field] = mappingData.column
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        sheetName: analysisResult.sheetName || worksheet.name,
        startRow: analysisResult.startRow || 2,
        fieldMapping,
        suggestedMappings: analysisResult.suggestedMappings,
        aiAnalysis: analysisResult.analysis,
        headers: headers.filter(h => h.trim()),
      },
    })
  } catch (error) {
    console.error('[Template Analyze] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
