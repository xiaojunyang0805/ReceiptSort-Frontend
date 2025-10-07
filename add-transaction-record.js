const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xalcrmpqhtakgkqiyere.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbGNybXBxaHRha2drcWl5ZXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwNjcwOSwiZXhwIjoyMDc1MDgyNzA5fQ.lIhF1-ZqoY4ROj9JrLsiSbNNtUEuaZWw-iWU4SShicw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTransaction() {
  const userId = '90123fcc-52ef-4895-aa1b-959318f5358a';
  const creditsAmount = 25;
  const sessionId = 'cs_live_a1SkwoIH5QWSqVja2C75EhFmnKVKu4R30b09kpBUI8XLwYXMOzN91oIelh';

  try {
    console.log('Creating transaction record...');
    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsAmount,
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
    console.log('\n✅ Transaction record added!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTransaction();
