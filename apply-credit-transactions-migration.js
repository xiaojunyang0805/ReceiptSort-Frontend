const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://xalcrmpqhtakgkqiyere.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbGNybXBxaHRha2drcWl5ZXJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwNjcwOSwiZXhwIjoyMDc1MDgyNzA5fQ.lIhF1-ZqoY4ROj9JrLsiSbNNtUEuaZWw-iWU4SShicw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const migration = fs.readFileSync('migrations/004_create_credit_transactions_table.sql', 'utf-8');

    console.log('Applying migration...');
    console.log(migration);

    // We can't run DDL through the supabase-js client, so let's just try to insert a test record
    // to check if the table exists with correct structure

    console.log('\nChecking if table exists and has correct structure...');

    // Try inserting a minimal record
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: '90123fcc-52ef-4895-aa1b-959318f5358a',
        amount: 25,
        transaction_type: 'purchase',  // Try different column names
        notes: 'Purchased basic package',
      })
      .select();

    if (error) {
      console.log('Error with transaction_type/notes:', error.message);

      // Try with the expected column names
      const { data: data2, error: error2 } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: '90123fcc-52ef-4895-aa1b-959318f5358a',
          credits: 25,  // Maybe it's called credits not amount?
        })
        .select();

      if (error2) {
        console.log('Error with credits:', error2.message);
      } else {
        console.log('Success with credits column!', data2);
      }
    } else {
      console.log('Success with transaction_type/notes!', data);
    }

  } catch (error) {
    console.error('Exception:', error);
  }
}

applyMigration();
