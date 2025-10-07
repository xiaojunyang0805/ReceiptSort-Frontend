const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xalcrmpqhtakgkqiyere.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbGNybXBxaHRha2drcWl5ZXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwNjcwOSwiZXhwIjoyMDc1MDgyNzA5fQ.lIhF1-ZqoY4ROj9JrLsiSbNNtUEuaZWw-iWU4SShicw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCredits() {
  const userId = '90123fcc-52ef-4895-aa1b-959318f5358a';
  const creditsToAdd = 25;
  const sessionId = 'cs_live_a1SkwoIH5QWSqVja2C75EhFmnKVKu4R30b09kpBUI8XLwYXMOzN91oIelh';
  const paymentIntent = 'pi_3SFKSI2Q25JDcEYX0Lojllob';

  try {
    // 1. Get current credits
    console.log('Fetching current credits...');
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return;
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    console.log(`Current credits: ${currentCredits}`);
    console.log(`Credits to add: ${creditsToAdd}`);
    console.log(`New total: ${newCredits}`);

    // 2. Update credits
    console.log('Updating credits...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return;
    }

    console.log('Credits updated successfully:', updateData);

    // 3. Create transaction record
    console.log('Creating transaction record...');
    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsToAdd,
        type: 'purchase',
        description: 'Purchased basic package',
        stripe_session_id: sessionId,
      })
      .select();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return;
    }

    console.log('Transaction created successfully:', transactionData);
    console.log('\n✅ Credits added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addCredits();
