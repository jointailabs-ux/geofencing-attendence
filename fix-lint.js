const fs = require('fs');

const filesToFix = [
  { path: 'src/app/admin/leave/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/admin/outlets/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/admin/outlets/[id]/edit/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/admin/payroll/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/admin/settings/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/manager/attendance/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/manager/leave/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/staff/attendance/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/staff/leave/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/staff/payslips/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' },
  { path: 'src/app/staff/profile/page.tsx', search: 'getCachedEmployee, getCachedUser', replace: 'getCachedUser' }
];

filesToFix.forEach(f => {
  try {
    let c = fs.readFileSync(f.path, 'utf8');
    c = c.replace(f.search, f.replace);
    fs.writeFileSync(f.path, c);
  } catch (e) {
    console.error(`Error processing ${f.path}`, e.message);
  }
});

// Fix specific manager dashboard lint error
try {
  let m = fs.readFileSync('src/app/manager/dashboard/page.tsx', 'utf8');
  m = m.replace('Users, CalendarOff, Building2, UserCheck, AlertCircle, Clock, LogOut, ArrowRight', 'CalendarOff, Building2, UserCheck, AlertCircle, Clock, ArrowRight');
  fs.writeFileSync('src/app/manager/dashboard/page.tsx', m);
} catch (e) {}

// Fix specific AdminBottomNav lint error
try {
  let n = fs.readFileSync('src/components/layout/AdminBottomNav.tsx', 'utf8');
  n = n.replace('LayoutDashboard, Building2, Users, ClipboardList, Banknote, CalendarOff', 'LayoutDashboard, Building2, Users, ClipboardList, CalendarOff');
  fs.writeFileSync('src/components/layout/AdminBottomNav.tsx', n);
} catch (e) {}

console.log('Fixed lint errors');
