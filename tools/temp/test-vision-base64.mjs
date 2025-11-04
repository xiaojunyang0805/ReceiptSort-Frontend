import OpenAI from 'openai'
import dotenv from 'dotenv'
import https from 'https'

// Load environment variables
dotenv.config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PNG URL from user's screenshot
const pngUrl = 'https://kmdbfqtdxphufpdwqaxq.supabase.co/storage/v1/object/public/receipts/50ae37c1-45f6-4cdf-9c5f-51fa41c1e3b2/1737966698467-converted-g7qqid.png'

console.log('Fetching PNG from Supabase Storage...')

// Fetch the image
const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

try {
  const imageBuffer = await fetchImage(pngUrl)
  console.log(`✓ Fetched ${imageBuffer.length} bytes`)

  // Convert to base64 data URL
  const base64 = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64}`

  console.log(`✓ Converted to base64 (${base64.length} chars)`)
  console.log('')
  console.log('Calling OpenAI Vision API with base64 data URL...')

  const PROMPT = `Extract receipt data from this Chinese electronic invoice (电子发票).

CRITICAL: Look for the SELLER section (销售方) on the RIGHT side.
Extract the merchant name from "名称:" label in the SELLER section.

Return JSON with: merchant_name, amount, currency, receipt_date, invoice_number`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: PROMPT,
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
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
  console.log('JSON response:')
  console.log(content)
  console.log('')

  const parsed = JSON.parse(content)

  console.log('Extracted data:')
  console.log('- Merchant:', parsed.merchant_name)
  console.log('- Amount:', parsed.amount, parsed.currency)
  console.log('- Date:', parsed.receipt_date)
  console.log('- Invoice #:', parsed.invoice_number)

} catch (error) {
  console.error('❌ Error:', error.message)
}
