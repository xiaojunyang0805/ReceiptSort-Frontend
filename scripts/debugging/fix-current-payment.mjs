#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCredits() {
  const email = '601404242@qq.com';
  const creditsToAdd = 25;

  console.log('🔧 Manually adding credits for completed payment...\n');

  // Get user
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, credits')
    .eq('email', email)
    .single();

  if (fetchError || !profiles) {
    console.error('❌ User not found:', fetchError);
    return;
  }

  const userId = profiles.id;
  const currentCredits = profiles.credits || 0;
  const newCredits = currentCredits + creditsToAdd;

  console.log(`Current credits: ${currentCredits}`);
  console.log(`Adding: ${creditsToAdd}`);
  console.log(`New total: ${newCredits}\n`);

  // Update credits
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Error updating credits:', updateError);
    return;
  }

  console.log(`✅ Credits updated successfully! ${currentCredits} -> ${newCredits}`);

  // Create transaction record
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: creditsToAdd,
      type: 'purchase',
      description: 'Manual credit addition for completed payment (webhook not configured)',
      stripe_session_id: 'cs_test_a1tPqfZWJ6QbZ9EmgxTPftaDNZDL8cuxRKarGB3gJttvMJvRXSPjFSRCwt'
    });

  if (txError) {
    console.error('⚠️  Error creating transaction:', txError);
  } else {
    console.log('✅ Transaction record created');
  }

  console.log('\n✅ Done! User should now have 35 credits total.');
  console.log('📧 Note: Invoice was not sent because webhook is not configured.');
  console.log('📖 See WEBHOOK_SETUP_GUIDE.md to configure webhooks.');
}

addCredits().catch(console.error);
