import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCredits() {
  const userId = '9e7094ee-30f5-44a5-90fb-e0856bb628b3';
  const creditsToAdd = 10;

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  const currentCredits = profile.credits || 0;
  const newCredits = currentCredits + creditsToAdd;

  console.log(`Adding ${creditsToAdd} credits: ${currentCredits} -> ${newCredits}`);

  await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', userId);

  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: creditsToAdd,
      type: 'purchase',
      description: 'Manual credit addition for Starter package (webhook fix in progress)'
    });

  console.log('✅ Credits updated to', newCredits);
}

addCredits();
