const fs = require('fs');
const files = [
  'src/app/admin/attendance/page.tsx',
  'src/app/admin/employees/new/page.tsx',
  'src/app/admin/employees/page.tsx',
  'src/app/admin/employees/[id]/edit/page.tsx',
  'src/app/admin/outlets/page.tsx',
  'src/app/admin/outlets/[id]/edit/page.tsx',
  'src/app/page.tsx',
  'src/app/staff/attendance/page.tsx'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import \{ createClient \} from '@\/lib\/supabase\/server'(\r?\n)/, "import { createClient } from '@/lib/supabase/server'\nimport { getCachedUser } from '@/lib/auth'\n");
  fs.writeFileSync(f, c);
});
