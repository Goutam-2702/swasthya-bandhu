const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://abdblukbngbapatrqvkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZGJsdWtibmdiYXBhdHJxdmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzMyMTUsImV4cCI6MjA5MDI0OTIxNX0.EG0iuvAJvJEUzRWMnvi-wVqhAd12DOBAuM9g0IsCoJQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase.from('patient_data').select('*').limit(3);
  if (error) console.error('Error:', error);
  else console.log('Data:', JSON.stringify(data, null, 2));
}

checkData();
