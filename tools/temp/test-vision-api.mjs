import OpenAI from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PNG URL from user's screenshot
const pngUrl = 'https://kmdbfqtdxphufpdwqaxq.supabase.co/storage/v1/object/public/receipts/50ae37c1-45f6-4cdf-9c5f-51fa41c1e3b2/1737966698467-converted-g7qqid.png'

console.log('Testing Vision API with PNG URL:', pngUrl)
console.log('')

const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction expert. Extract structured data from receipts with high accuracy.

CRITICAL: Extract data EXACTLY as shown. NEVER generate or infer values.

For Chinese electronic invoices (电子发票):
- Look for "销售方" (seller) section on the RIGHT side
- Extract merchant name from "名称:" label in the SELLER section (销售方)
- CRITICAL: Extract SELLER name (销售方), NOT buyer name (购买方)
- Invoice number: Look for "发票号码" (usually 20-24 digits)
- Date format: "YYYY年MM月DD日" → convert to "YYYY-MM-DD"
- Currency: ¥ symbol = CNY for Chinese invoices

Return JSON:
{
  "merchant_name": "Business name from receipt",
  "amount": 123.45,
  "currency": "CNY",
  "receipt_date": "2025-10-14",
  "category": "Transportation",
  "confidence_score": 0.95,
  "raw_text": "Full OCR text",
  "invoice_number": "25337000000484274975"
}`

try {
  console.log('Calling OpenAI Vision API...')

  const response = await openai.chat.completions.create({
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
              url: pngUrl,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content

  console.log('✓ Vision API response received')
  console.log('')
  console.log('Raw JSON response:')
  console.log(content)
  console.log('')

  const parsed = JSON.parse(content)

  console.log('Parsed data:')
  console.log('- Merchant:', parsed.merchant_name)
  console.log('- Amount:', parsed.amount, parsed.currency)
  console.log('- Date:', parsed.receipt_date)
  console.log('- Invoice #:', parsed.invoice_number)
  console.log('- Category:', parsed.category)
  console.log('- Confidence:', parsed.confidence_score)
  console.log('')
  console.log('Raw text preview:', parsed.raw_text?.substring(0, 200))

} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error)
}
