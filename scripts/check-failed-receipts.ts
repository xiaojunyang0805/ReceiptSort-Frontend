import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFailedReceipts() {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('processing_status', 'failed')
    .ilike('file_name', 'Yang_med_01%')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n=== Failed Receipts ===\n')
  data?.forEach(receipt => {
    console.log(`File: ${receipt.file_name}`)
    console.log(`Status: ${receipt.processing_status}`)
    console.log(`Error: ${receipt.processing_error}`)
    console.log(`File Path: ${receipt.file_path}`)
    console.log(`File Type: ${receipt.file_type}`)
    console.log('---')
  })
}

checkFailedReceipts()
