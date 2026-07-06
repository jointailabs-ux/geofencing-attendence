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
// Use service role key to bypass RLS policies
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const orgId = '11111111-1111-1111-1111-111111111111';
const outlet1 = '22222222-2222-2222-2222-222222222221';
const outlet2 = '22222222-2222-2222-2222-222222222222';

const leaveTypes = [
  { id: '55555555-5555-5555-5555-555555555551', org_id: orgId, name: 'Annual Leave', is_paid: true, annual_allocation_days: 14 },
  { id: '55555555-5555-5555-5555-555555555552', org_id: orgId, name: 'Sick Leave', is_paid: true, annual_allocation_days: 7 },
  { id: '55555555-5555-5555-5555-555555555553', org_id: orgId, name: 'Unpaid Leave', is_paid: false, annual_allocation_days: 0 }
];

const employees = Array.from({ length: 10 }).map((_, i) => ({
  id: `33333333-3333-3333-3333-33333333333${i}`,
  org_id: orgId,
  auth_user_id: null, // to be updated when auth user is created
  outlet_id: i < 5 ? outlet1 : outlet2,
  role: i === 0 ? 'super_admin' : (i < 3 ? 'manager' : 'staff'),
  full_name: i === 0 ? 'Demo Admin' : (i === 1 ? 'Demo Manager' : (i === 5 ? 'Demo Staff' : `Employee ${i + 1}`)),
  email: i === 0 ? 'admin@demo.com' : (i === 1 ? 'manager@demo.com' : (i === 5 ? 'staff@demo.com' : `emp${i + 1}@example.com`)),
  phone: `999999999${i}`,
  status: 'active',
  salary_type: 'fixed',
  base_salary: 30000 + (i * 5000),
  join_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}));

async function seed() {
  console.log("⏳ Starting seeding process...");

  // 1. Insert organization
  console.log("Inserting organization...");
  const { error: orgErr } = await supabase.from('organizations').upsert({ id: orgId, name: 'Demo Corp (Seed Data)' });
  if (orgErr) {
    console.error("❌ Error inserting organization:", orgErr.message);
    process.exit(1);
  }

  // 2. Insert outlets
  console.log("Inserting outlets...");
  const { error: outletErr } = await supabase.from('outlets').upsert([
    { id: outlet1, org_id: orgId, name: 'Downtown Branch', latitude: 12.9716, longitude: 77.5946, radius_meters: 100, buffer_meters: 20, address: 'MG Road' },
    { id: outlet2, org_id: orgId, name: 'Uptown Branch', latitude: 13.0827, longitude: 80.2707, radius_meters: 100, buffer_meters: 20, address: 'Mount Road' }
  ]);
  if (outletErr) {
    console.error("❌ Error inserting outlets:", outletErr.message);
    process.exit(1);
  }

  // 3. Insert leave types
  console.log("Inserting leave types...");
  const { error: ltErr } = await supabase.from('leave_types').upsert(leaveTypes);
  if (ltErr) {
    console.error("❌ Error inserting leave types:", ltErr.message);
    process.exit(1);
  }

  // 4. Create Auth users first and update auth_user_id in employees list
  console.log("Creating or updating auth users...");
  const demoUsers = [
    { email: 'admin@demo.com', role: 'super_admin', empId: '33333333-3333-3333-3333-333333333330', name: 'Demo Admin' },
    { email: 'manager@demo.com', role: 'manager', empId: '33333333-3333-3333-3333-333333333331', name: 'Demo Manager' },
    { email: 'staff@demo.com', role: 'staff', empId: '33333333-3333-3333-3333-333333333335', name: 'Demo Staff' }
  ];

  const authUserIds = {};

  for (const du of demoUsers) {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users.find(x => x.email === du.email);

    if (existing) {
      console.log(`ℹ️ Auth user ${du.email} already exists.`);
      authUserIds[du.empId] = existing.id;
    } else {
      console.log(`Creating auth user ${du.email}...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: du.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: du.name }
      });

      if (authError) {
        console.error(`❌ Error creating auth user ${du.email}:`, authError.message);
      } else {
        console.log(`✅ Auth user created for ${du.email}`);
        authUserIds[du.empId] = authData.user.id;
      }
    }
  }

  // Assign auth_user_ids to the employees list
  for (const emp of employees) {
    if (authUserIds[emp.id]) {
      emp.auth_user_id = authUserIds[emp.id];
    }
  }

  // 5. Insert employees
  console.log("Inserting employees...");
  const { error: empErr } = await supabase.from('employees').upsert(employees);
  if (empErr) {
    console.error("❌ Error inserting employees:", empErr.message);
    process.exit(1);
  }

  // 6. Insert attendance logs
  console.log("Inserting attendance logs...");
  const attendanceLogs = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Skip Sundays
    if (d.getDay() === 0) continue;
    
    for (const e of employees) {
      // 90% attendance chance
      if (Math.random() < 0.9) {
        const checkinTime = new Date(d);
        checkinTime.setHours(9, Math.floor(Math.random() * 30), 0);
        
        const checkoutTime = new Date(d);
        checkoutTime.setHours(17, Math.floor(Math.random() * 30), 0);
        
        const status = Math.random() < 0.05 ? 'flagged' : 'valid';
        const isOutlet1 = e.outlet_id === outlet1;
        const baseLat = isOutlet1 ? 12.9716 : 13.0827;
        const baseLng = isOutlet1 ? 77.5946 : 80.2707;

        const checkinLat = baseLat + (Math.random() * 0.0005);
        const checkinLng = baseLng + (Math.random() * 0.0005);
        
        attendanceLogs.push({
          employee_id: e.id,
          outlet_id: e.outlet_id,
          type: 'check_in',
          timestamp: checkinTime.toISOString(),
          submitted_lat: checkinLat,
          submitted_lng: checkinLng,
          gps_accuracy_meters: 15,
          distance_from_outlet_meters: 10 + Math.floor(Math.random() * 20),
          status: status
        });

        attendanceLogs.push({
          employee_id: e.id,
          outlet_id: e.outlet_id,
          type: 'check_out',
          timestamp: checkoutTime.toISOString(),
          submitted_lat: checkinLat,
          submitted_lng: checkinLng,
          gps_accuracy_meters: 15,
          distance_from_outlet_meters: 10 + Math.floor(Math.random() * 20),
          status: status
        });
      }
    }
  }

  const { error: attErr } = await supabase.from('attendance_logs').insert(attendanceLogs);
  if (attErr) {
    console.error("❌ Error inserting attendance logs:", attErr.message);
  }

  // 7. Insert leave balances
  console.log("Inserting leave balances...");
  const leaveBalances = [];
  for (const e of employees) {
    leaveBalances.push({
      employee_id: e.id,
      leave_type_id: leaveTypes[0].id,
      year: 2026,
      allocated_days: 14,
      used_days: 2
    });
    leaveBalances.push({
      employee_id: e.id,
      leave_type_id: leaveTypes[1].id,
      year: 2026,
      allocated_days: 7,
      used_days: 1
    });
  }

  const { error: lbErr } = await supabase.from('leave_balances').upsert(leaveBalances);
  if (lbErr) {
    console.error("❌ Error inserting leave balances:", lbErr.message);
  }

  // 8. Insert leave requests
  console.log("Inserting leave requests...");
  const leaveRequests = [];
  for (const e of employees) {
    const pastStart = new Date(now);
    pastStart.setDate(pastStart.getDate() - 20);
    const pastEnd = new Date(pastStart);
    pastEnd.setDate(pastEnd.getDate() + 1);

    leaveRequests.push({
      employee_id: e.id,
      leave_type_id: leaveTypes[0].id,
      start_date: pastStart.toISOString().split('T')[0],
      end_date: pastEnd.toISOString().split('T')[0],
      reason: 'Family vacation',
      status: 'approved'
    });

    if (Math.random() < 0.3) {
      const futStart = new Date(now);
      futStart.setDate(futStart.getDate() + 10);
      leaveRequests.push({
        employee_id: e.id,
        leave_type_id: leaveTypes[0].id,
        start_date: futStart.toISOString().split('T')[0],
        end_date: futStart.toISOString().split('T')[0],
        reason: 'Personal work',
        status: 'pending'
      });
    }
  }

  const { error: lrErr } = await supabase.from('leave_requests').insert(leaveRequests);
  if (lrErr) {
    console.error("❌ Error inserting leave requests:", lrErr.message);
  }

  // 9. Finalized payroll run
  console.log("Inserting payroll runs...");
  const payrollRunId = '66666666-6666-6666-6666-666666666661';
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const { error: prErr } = await supabase.from('payroll_runs').upsert({
    id: payrollRunId,
    org_id: orgId,
    month: lastMonth,
    year: lastMonthYear,
    status: 'finalized',
    generated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    finalized_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (prErr) {
    console.error("❌ Error inserting payroll run:", prErr.message);
  } else {
    console.log("Inserting payroll line items...");
    const lineItems = employees.map(e => ({
      payroll_run_id: payrollRunId,
      employee_id: e.id,
      days_present: 22,
      days_leave_paid: 0,
      days_leave_unpaid: 0,
      days_absent_unexcused: 0,
      base_pay: e.base_salary,
      overtime_pay: 0,
      manual_adjustments: 0,
      deductions: 0,
      net_pay: e.base_salary
    }));

    const { error: liErr } = await supabase.from('payroll_line_items').insert(lineItems);
    if (liErr) {
      console.error("❌ Error inserting payroll line items:", liErr.message);
    }
  }

  console.log("\n🎉 Database successfully seeded!");
  console.log("--------------------------------------");
  console.log("Demo Credentials:");
  console.log("1. Admin (Super Admin):");
  console.log("   Email: admin@demo.com");
  console.log("   Password: password123");
  console.log("2. Manager:");
  console.log("   Email: manager@demo.com");
  console.log("   Password: password123");
  console.log("3. Staff:");
  console.log("   Email: staff@demo.com");
  console.log("   Password: password123");
  console.log("--------------------------------------");
}

seed();
