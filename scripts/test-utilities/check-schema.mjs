import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking profiles table schema...\n')

  // Try to insert with different column names
  const possibleColumns = [
    'credits_remaining',
    'credits',
    'credit_balance',
    'remaining_credits'
  ]

  // Get a sample by trying to select various columns
  console.log('Testing column names...')

  for (const col of possibleColumns) {
    const { data, error } = await supabase
      .from('profiles')
      .select(col)
      .limit(1)

    if (!error) {
      console.log(`✅ Column '${col}' exists`)
    }
  }

  // Try to see what columns we CAN select
  console.log('\nAttempting to select all columns...')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(0)

  if (error) {
    console.log('Error:', error.message)
  } else {
    console.log('Query successful (no data expected)')
  }
}

checkSchema().catch(console.error)
