import OpenAI from 'openai'
import { ExtractedReceiptData, ReceiptCategory, PaymentMethod } from '@/types/receipt'

// Initialize OpenAI client (lazy initialization for scripts)
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

/**
 * System prompt for receipt data extraction
 * Optimized for consistent, accurate extraction with enhanced rules
 */
const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction expert. Extract structured data from receipt images with high accuracy.

Return ONLY valid JSON, no other text:
{
  "merchant_name": "Business name from receipt",
  "amount": 123.45,
  "currency": "USD",
  "receipt_date": "2025-10-09",
  "category": "Food & Dining",
  "tax_amount": 10.50,
  "payment_method": "Credit Card",
  "confidence_score": 0.95,
  "raw_text": "Full OCR text here"
}

CRITICAL RULES:

1. AMOUNT EXTRACTION:
   - MUST be the TOTAL/GRAND TOTAL (after tax, including all fees)
   - Look for keywords: "TOTAL", "GRAND TOTAL", "AMOUNT DUE", "BALANCE DUE", "TOTAL DUE"
   - Ignore: "SUBTOTAL", "SUB-TOTAL", "CASH", "CHANGE"
   - Example: If receipt shows "SUBTOTAL $50, TAX $5, TOTAL $55" → amount is 55.00

2. DATE EXTRACTION:
   - Format: YYYY-MM-DD (convert all dates to this format)
   - Parse various formats: "3/15/12" → "2012-03-15", "11/02/2020" → "2020-11-02"
   - Look near top of receipt or near transaction details
   - If year is 2 digits: assume 20XX for 00-25, 19XX for 26-99
   - If no date found: use null (DO NOT use today's date)

3. MERCHANT NAME:
   - Extract from the TOP of receipt (first 1-3 lines)
   - If only generic name visible (like "SUPERMARKET"), still use it - don't leave null
   - Lower confidence to 0.7 if merchant name is generic/placeholder
   - Avoid extracting: addresses, phone numbers, or footer text as merchant name

4. CATEGORY SELECTION:
   - Food & Dining: Restaurants, cafes, grocery stores, supermarkets, bars
   - Transportation: Gas stations, auto parts, car repairs, parking, tolls, rideshare
   - Shopping: Retail stores, online purchases, clothing, electronics
   - Office Supplies: Stationery, printing, office equipment
   - Travel: Hotels, flights, accommodation, luggage
   - Entertainment: Movies, concerts, games, streaming
   - Utilities: Phone, internet, electricity, water, postal services
   - Healthcare: Pharmacy, medical, dental, hospital
   - Other: Everything else

   Examples:
   - "O'Reilly Auto Parts" → Transportation
   - "Post Office" → Utilities
   - "Grocery Depot" → Food & Dining
   - "East Repair Inc." (bike repair) → Transportation

5. CURRENCY:
   - $ or USD → USD
   - € or EUR → EUR
   - £ or GBP → GBP
   - CHF or Fr. → CHF
   - If symbol unclear: use USD as default

6. PAYMENT METHOD:
   - Look for: "VISA", "MASTERCARD", "CREDIT", "DEBIT", "CASH", "BANK TRANSFER"
   - Credit Card: If "CREDIT", "VISA/MC/AMEX" without "DEBIT"
   - Debit Card: If "DEBIT" or "DEBIT CARD"
   - Cash: If "CASH" or "CASH PAYMENT"
   - Bank Transfer: If "BANK TRANSFER", "ACH", "WIRE"
   - Unknown: If payment method not clearly stated

7. CONFIDENCE SCORE:
   - 1.0: All fields crystal clear, no ambiguity
   - 0.95: Minor uncertainty (1-2 fields slightly unclear)
   - 0.85: Moderate uncertainty (faded text, multiple possible values)
   - 0.7: Low quality image or generic placeholders used
   - 0.5: Poor quality, many fields unclear

8. FALLBACK RULES:
   - merchant_name: REQUIRED - use best available name, even if generic
   - amount: REQUIRED - must be clear TOTAL value
   - currency: REQUIRED - default to USD if symbol unclear
   - receipt_date: Use null if not found (NOT today's date)
   - If core fields (merchant, amount, currency) unclear: extraction fails
   - Always extract raw_text even if extraction fails

Return valid JSON only. No markdown, no explanations.`

/**
 * Extract receipt data from an image or PDF using OpenAI Vision API
 *
 * @param imageUrl - Publicly accessible URL or base64 data URL of the receipt (supports images and PDFs)
 * @returns Structured receipt data
 * @throws Error if extraction fails
 *
 * Note: gpt-4o supports both images (JPG, PNG, WebP) and PDF files natively
 */
export async function extractReceiptData(
  imageUrl: string
): Promise<ExtractedReceiptData> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const client = getOpenAIClient()

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: RECEIPT_EXTRACTION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high', // Use high detail for better accuracy
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for consistent output
    })

    // Extract the response text
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI Vision API')
    }

    // Parse JSON response
    let extractedData: Partial<ExtractedReceiptData>
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      extractedData = JSON.parse(cleanedContent)
    } catch {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid JSON response from OpenAI Vision API')
    }

    // Validate required fields
    if (!extractedData.merchant_name || !extractedData.amount || !extractedData.currency) {
      throw new Error('Missing required fields in extracted data')
    }

    // Validate and normalize data
    const validatedData: ExtractedReceiptData = {
      merchant_name: String(extractedData.merchant_name).trim(),
      amount: Number(extractedData.amount),
      currency: String(extractedData.currency).toUpperCase(),
      receipt_date: extractedData.receipt_date || null, // Allow null if date not found
      category: validateCategory(extractedData.category),
      tax_amount: extractedData.tax_amount ? Number(extractedData.tax_amount) : null,
      payment_method: validatePaymentMethod(extractedData.payment_method),
      confidence_score: validateConfidenceScore(extractedData.confidence_score),
      raw_text: String(extractedData.raw_text || '').trim(),
    }

    return validatedData
  } catch (error) {
    console.error('Receipt extraction error:', error)

    // Provide detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is not configured correctly')
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('OpenAI API quota exceeded or rate limited')
      }
      throw error
    }

    throw new Error('Failed to extract receipt data')
  }
}

/**
 * Validate and normalize category
 */
function validateCategory(category: string | undefined): ReceiptCategory {
  const validCategories: ReceiptCategory[] = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Office Supplies',
    'Travel',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Other',
  ]

  if (category && validCategories.includes(category as ReceiptCategory)) {
    return category as ReceiptCategory
  }

  return 'Other'
}

/**
 * Validate and normalize payment method
 */
function validatePaymentMethod(
  paymentMethod: string | undefined | null
): PaymentMethod | null {
  const validMethods: PaymentMethod[] = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Unknown',
  ]

  if (paymentMethod && validMethods.includes(paymentMethod as PaymentMethod)) {
    return paymentMethod as PaymentMethod
  }

  return null
}

/**
 * Validate confidence score (must be between 0 and 1)
 */
function validateConfidenceScore(score: number | undefined): number {
  if (typeof score === 'number' && score >= 0 && score <= 1) {
    return score
  }
  return 0.5 // Default to medium confidence if not provided
}

/**
 * Test function to verify OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return false
    }

    const client = getOpenAIClient()

    // Make a simple API call to verify connection
    await client.models.list()
    return true
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}
