const fs = require('fs');
const path = require('path');

// Basic manual parsing since we just need the three keys
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0 && !key.trim().startsWith('#')) {
    env[key.trim()] = values.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Failed to find NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("⏳ Testing Supabase connection to: " + supabaseUrl);
  
  // Try to query the organizations table
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  
  if (error) {
    console.error("❌ Database connection failed!");
    console.error("Error details:", error.message);
  } else {
    console.log("✅ Database connection successful!");
    if (data && data.length > 0) {
      console.log(`✅ Successfully fetched data from the database. Found organization: ${data[0].name}`);
    } else {
      console.log("✅ Successfully connected, but the database is currently empty (no organizations found).");
    }
  }
}

testConnection();
