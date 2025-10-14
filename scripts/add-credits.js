const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addCredits(email, amount) {
  try {
    console.log(`Adding ${amount} credits to ${email}...`)

    // Get user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.error(`User not found: ${email}`)
      return
    }

    console.log(`Found user: ${user.id}`)

    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching credits:', fetchError)
      return
    }

    const oldCredits = currentCredits.credits
    const newCredits = oldCredits + amount

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return
    }

    console.log(`✓ Success!`)
    console.log(`  Email: ${email}`)
    console.log(`  Old credits: ${oldCredits}`)
    console.log(`  Added: ${amount}`)
    console.log(`  New credits: ${newCredits}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
const email = process.argv[2] || '42535832@qq.com'
const amount = parseInt(process.argv[3] || '500')

addCredits(email, amount)
