const fs = require('fs');

const replaces = [
  { p: 'src/app/admin/attendance/page.tsx', s: /import { getCachedEmployee, getCachedUser } from '@\/lib\/auth'\\n/, r: 'import { getCachedUser } from \\'@/lib/auth\\'\\n' },
  { p: 'src/app/admin/dashboard/page.tsx', s: 'AlertCircle, ArrowUpRight', r: 'ArrowUpRight' },
  { p: 'src/app/admin/employees/new/page.tsx', s: /import { getCachedEmployee, getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/admin/employees/page.tsx', s: /import { getCachedEmployee, getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/admin/employees/[id]/edit/page.tsx', s: /import { getCachedEmployee, getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/admin/outlets/page.tsx', s: /import { getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/admin/outlets/[id]/edit/page.tsx', s: /import { getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/page.tsx', s: /import { getCachedUser } from '@\/lib\/auth'\\n/, r: '' },
  { p: 'src/app/staff/attendance/page.tsx', s: /import { getCachedUser } from '@\/lib\/auth'\\n/, r: '' }
];

replaces.forEach(({ p, s, r }) => {
  try {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(s, r);
    fs.writeFileSync(p, c);
  } catch (e) {}
});
