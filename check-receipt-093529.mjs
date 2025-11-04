import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const { data: receipt, error } = await supabase
  .from('receipts')
  .select('*')
  .ilike('file_name', '%093529%')
  .single()

if (error) {
  console.error('Error:', error)
} else {
  console.log('Receipt Details for IMG_20251104_093529.jpg:')
  console.log('='.repeat(60))
  console.log('Merchant:', receipt.merchant_name)
  console.log('Invoice Number:', receipt.invoice_number)
  console.log('Total Amount:', receipt.total_amount)
  console.log('Currency:', receipt.currency)
  console.log('Subtotal:', receipt.subtotal)
  console.log('Tax Amount:', receipt.tax_amount)
  console.log('')
  console.log('Insurance Breakdown:')
  console.log('Insurance Covered:', receipt.insurance_covered_amount)
  console.log('Patient Responsibility:', receipt.patient_responsibility_amount)
  console.log('')
  console.log('Raw OCR Text (first 500 chars):')
  console.log(receipt.raw_ocr_text?.substring(0, 500))
}
