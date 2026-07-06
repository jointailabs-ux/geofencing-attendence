const fs = require('fs')

const orgId = '11111111-1111-1111-1111-111111111111'
const outlet1 = '22222222-2222-2222-2222-222222222221'
const outlet2 = '22222222-2222-2222-2222-222222222222'

const employees = Array.from({length: 10}).map((_, i) => ({
  id: `33333333-3333-3333-3333-33333333333${i}`,
  auth_user_id: `44444444-4444-4444-4444-44444444444${i}`, // Dummy
  role: i === 0 ? 'super_admin' : (i < 3 ? 'manager' : 'staff'),
  outlet_id: i < 5 ? outlet1 : outlet2,
  name: `Employee ${i + 1}`,
  email: `emp${i + 1}@example.com`,
  salary_type: 'fixed',
  salary_amount: 30000 + (i * 5000),
  status: 'active'
}))

const leaveTypes = [
  { id: '55555555-5555-5555-5555-555555555551', name: 'Annual Leave', isPaid: true, defaultDays: 14 },
  { id: '55555555-5555-5555-5555-555555555552', name: 'Sick Leave', isPaid: true, defaultDays: 7 },
  { id: '55555555-5555-5555-5555-555555555553', name: 'Unpaid Leave', isPaid: false, defaultDays: 0 }
]

let sql = `-- Demo Seed Data for GeoAttend
-- IMPORTANT: This seed assumes you have already run the previous schema migrations.
-- This does NOT create auth.users records, so you cannot log in as these users.
-- They exist purely to populate the dashboards and tables for demo purposes.

BEGIN;

INSERT INTO organizations (id, name, created_at) VALUES 
('${orgId}', 'Demo Corp (Seed Data)', NOW()) ON CONFLICT DO NOTHING;

INSERT INTO outlets (id, org_id, name, latitude, longitude, radius_meters, buffer_meters, address, created_at) VALUES 
('${outlet1}', '${orgId}', 'Downtown Branch', 12.9716, 77.5946, 100, 20, 'MG Road', NOW()),
('${outlet2}', '${orgId}', 'Uptown Branch', 13.0827, 80.2707, 100, 20, 'Mount Road', NOW()) ON CONFLICT DO NOTHING;
`

sql += `\n-- Leave Types\n`
for (const lt of leaveTypes) {
  sql += `INSERT INTO leave_types (id, org_id, name, is_paid, default_days, requires_approval, created_at) VALUES ('${lt.id}', '${orgId}', '${lt.name}', ${lt.isPaid}, ${lt.defaultDays}, true, NOW()) ON CONFLICT DO NOTHING;\n`
}

sql += `\n-- Employees\n`
for (const e of employees) {
  sql += `INSERT INTO employees (id, org_id, auth_user_id, outlet_id, role, full_name, email, phone, status, salary_type, salary_amount, join_date, created_at) 
VALUES ('${e.id}', '${orgId}', '${e.auth_user_id}', '${e.outlet_id}', '${e.role}', '${e.name}', '${e.email}', '999999999${e.id.slice(-1)}', '${e.status}', '${e.salary_type}', ${e.salary_amount}, NOW() - INTERVAL '90 days', NOW()) ON CONFLICT DO NOTHING;\n`
}

sql += `\n-- Attendance Logs (Last 3 days)\n`
const now = new Date()
for (let i = 3; i >= 0; i--) {
  const d = new Date(now)
  d.setDate(d.getDate() - i)
  
  // Skip Sundays
  if (d.getDay() === 0) continue
  
  for (const e of employees) {
    // 90% attendance chance
    if (Math.random() < 0.9) {
      const checkinTime = new Date(d)
      checkinTime.setHours(9, Math.floor(Math.random() * 30), 0)
      
      const checkoutTime = new Date(d)
      checkoutTime.setHours(17, Math.floor(Math.random() * 30), 0)
      
      const status = Math.random() < 0.05 ? 'flagged' : 'valid'
      const checkinLat = 12.9716 + (Math.random() * 0.001)
      const checkinLng = 77.5946 + (Math.random() * 0.001)
      
      sql += `INSERT INTO attendance_logs (employee_id, outlet_id, type, timestamp, submitted_lat, submitted_lng, gps_accuracy_meters, distance_from_outlet_meters, status) VALUES 
      ('${e.id}', '${e.outlet_id}', 'check_in', '${checkinTime.toISOString()}', ${checkinLat}, ${checkinLng}, 15, 20, '${status}'),
      ('${e.id}', '${e.outlet_id}', 'check_out', '${checkoutTime.toISOString()}', ${checkinLat}, ${checkinLng}, 15, 20, '${status}');\n`
    }
  }
}

sql += `\n-- Leave Requests & Balances\n`
for (const e of employees) {
  sql += `INSERT INTO leave_balances (employee_id, leave_type_id, total_days, used_days, year) VALUES 
  ('${e.id}', '${leaveTypes[0].id}', 14, 2, 2026),
  ('${e.id}', '${leaveTypes[1].id}', 7, 1, 2026) ON CONFLICT DO NOTHING;\n`
  
  // Create a past leave
  const pastStart = new Date(now)
  pastStart.setDate(pastStart.getDate() - 20)
  const pastEnd = new Date(pastStart)
  pastEnd.setDate(pastEnd.getDate() + 1)
  
  sql += `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, created_at) VALUES 
  ('${e.id}', '${leaveTypes[0].id}', '${pastStart.toISOString().split('T')[0]}', '${pastEnd.toISOString().split('T')[0]}', 'Family vacation', 'approved', NOW() - INTERVAL '25 days');\n`
  
  // Create a pending leave randomly
  if (Math.random() < 0.3) {
    const futStart = new Date(now)
    futStart.setDate(futStart.getDate() + 10)
    sql += `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, created_at) VALUES 
    ('${e.id}', '${leaveTypes[0].id}', '${futStart.toISOString().split('T')[0]}', '${futStart.toISOString().split('T')[0]}', 'Personal work', 'pending', NOW() - INTERVAL '1 days');\n`
  }
}

const payrollRunId = '66666666-6666-6666-6666-666666666661'
const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

sql += `\n-- Finalized Payroll Run (Last Month)\n`
sql += `INSERT INTO payroll_runs (id, org_id, month, year, status, generated_at, finalized_at) VALUES ('${payrollRunId}', '${orgId}', ${lastMonth}, ${lastMonthYear}, 'finalized', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days') ON CONFLICT DO NOTHING;\n`

for (const e of employees) {
  const netPay = e.salary_amount
  sql += `INSERT INTO payroll_line_items (payroll_run_id, employee_id, days_present, days_leave_paid, days_leave_unpaid, days_absent_unexcused, base_pay, overtime_pay, manual_adjustments, deductions, net_pay) VALUES 
  ('${payrollRunId}', '${e.id}', 22, 0, 0, 0, ${netPay}, 0, 0, 0, ${netPay});\n`
}

sql += `\nCOMMIT;\n`

fs.writeFileSync('C:\\Users\\Koushik\\.gemini\\antigravity-ide\\brain\\cff434f8-74ff-4cfb-9b62-3f208787dc4b\\seed.sql', sql)
console.log('Seed SQL generated.')
