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
  const orgId = '11111111-1111-1111-1111-111111111111';
  
  // Check if seed.sql was run
  const { data: org } = await supabase.from('organizations').select('id').eq('id', orgId).single();
  
  if (!org) {
    console.error("❌ Demo organization not found. Please run the seed.sql script in Supabase first!");
    process.exit(1);
  }

  const users = [
    { email: 'admin@demo.com', role: 'super_admin', name: 'Demo Admin', empId: '33333333-3333-3333-3333-333333333330' },
    { email: 'manager@demo.com', role: 'manager', name: 'Demo Manager', empId: '33333333-3333-3333-3333-333333333331' },
    { email: 'staff@demo.com', role: 'staff', name: 'Demo Staff', empId: '33333333-3333-3333-3333-333333333335' }
  ];

  for (const u of users) {
    // 1. Create auth user (admin api bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: u.name }
    });

    if (authError) {
       console.log(`⚠️ Note on ${u.email}: ${authError.message}`);
       
       // Try to fetch existing user if it says already exists
       if (authError.message.includes('already')) {
         const { data: listData } = await supabase.auth.admin.listUsers();
         const existing = listData?.users.find(x => x.email === u.email);
         if (existing) {
             await linkEmployee(existing.id, u.empId, u.email, u.role);
         }
       }
       continue;
    }

    const userId = authData.user.id;
    await linkEmployee(userId, u.empId, u.email, u.role);
  }
}

async function linkEmployee(userId, empId, email, role) {
    // 2. Link the auth user to the dummy employee created by seed.sql
    const { error: empError } = await supabase.from('employees')
      .update({ auth_user_id: userId, email: email })
      .eq('id', empId);

    if (empError) {
       console.error(`❌ Error linking ${email}: ${empError.message}`);
    } else {
       console.log(`✅ Successfully provisioned: ${email} (Role: ${role})`);
    }
}

run();
