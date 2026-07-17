const fs = require('fs')
const path = require('path')

const filesToUpdate = [
  'src/app/admin/attendance/page.tsx',
  'src/app/admin/employees/page.tsx',
  'src/app/admin/employees/new/page.tsx',
  'src/app/admin/employees/[id]/edit/page.tsx',
  'src/app/admin/leave/page.tsx',
  'src/app/admin/outlets/page.tsx',
  'src/app/admin/outlets/[id]/edit/page.tsx',
  'src/app/admin/payroll/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/manager/attendance/page.tsx',
  'src/app/manager/leave/page.tsx',
  'src/app/staff/attendance/page.tsx',
  'src/app/staff/leave/page.tsx',
  'src/app/staff/payslips/page.tsx',
  'src/app/staff/profile/page.tsx',
  'src/app/page.tsx' // Add the root page.tsx
]

const rootDir = process.cwd()

filesToUpdate.forEach(file => {
  const filePath = path.join(rootDir, file)
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')

  // Check if it already imports getCachedEmployee
  if (content.includes('getCachedEmployee')) {
      return;
  }

  // 1. Add import for getCachedEmployee or getCachedUser
  if (content.includes("import { createClient }")) {
      content = content.replace("import { createClient } from '@/lib/supabase/server'", "import { createClient } from '@/lib/supabase/server'\nimport { getCachedEmployee, getCachedUser } from '@/lib/auth'")
  } else {
      content = "import { getCachedEmployee, getCachedUser } from '@/lib/auth'\n" + content
  }

  // 2. Replace auth logic.
  // Case A: Fetches user, then fetches employee
  if (content.includes('.from(\'employees\')')) {
      // It's too complex to regex everything. We can just replace getUser and use getCachedUser, but then employee fetch is still there.
      // Let's just replace `await supabase.auth.getUser()` with `await getCachedUser()`
  }

  // Simply replace `await supabase.auth.getUser()` with `await getCachedUser()` wrapped in `{ data: { user: await getCachedUser() } }` mock or similar? No, better:
  content = content.replace(/const\s+\{\s*data:\s*\{\s*user\s*\}\s*,?\s*error:\s*[a-zA-Z0-9_]+\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g, "const user = await getCachedUser()")
  content = content.replace(/const\s+\{\s*data:\s*\{\s*user\s*\}\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g, "const user = await getCachedUser()")
  content = content.replace(/const\s+\{\s*data:\s*authData\s*\}\s*=\s*await\s+supabase\.auth\.getUser\(\)/g, "const user = await getCachedUser(); const authData = { user }")

  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Updated ${file}`)
})
