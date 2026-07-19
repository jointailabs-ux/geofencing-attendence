const fs = require('fs');
const path = require('path');

// Read .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0 && !key.trim().startsWith('#')) {
    env[key.trim()] = values.join('=').trim();
  }
});

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const users = [
    { email: 'admin@demo.com', pin: '111111' },
    { email: 'manager@demo.com', pin: '222222' },
    { email: 'staff@demo.com', pin: '333333' }
  ];

  for (const u of users) {
    const existing = listData.users.find(x => x.email === u.email);
    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: u.pin });
      if (error) {
        console.error(`❌ Error updating ${u.email}: ${error.message}`);
      } else {
        console.log(`✅ Successfully updated password/PIN for: ${u.email} to ${u.pin}`);
      }
    } else {
      console.log(`⚠️ User not found for ${u.email}`);
    }
  }
}

run();
