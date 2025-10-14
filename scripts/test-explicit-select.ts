/**
 * Test Explicit Column Selection
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function test() {
  console.log('Testing explicit column selection...\n')

  // Test 1: Select all columns explicitly
  const { data: test1, error: error1 } = await supabase
    .from('profiles')
    .select('id, full_name, credits, is_admin, created_at, updated_at')
    .limit(3)

  console.log('Test 1 - Explicit columns:', { data: test1, error: error1 })

  // Test 2: Select just is_admin
  const { data: test2, error: error2 } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .limit(3)

  console.log('\nTest 2 - Just is_admin:', { data: test2, error: error2 })
}

test()
