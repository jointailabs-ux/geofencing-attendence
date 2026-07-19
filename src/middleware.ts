import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback']

// Role → default route mapping
const ROLE_ROUTES: Record<string, string> = {
  super_admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  staff: '/staff/dashboard',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if environment variables are configured (prevents MIDDLEWARE_INVOCATION_FAILED on Vercel)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      `<html>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #f4f4f5; text-align: center; padding: 20px;">
          <div style="max-width: 500px; padding: 30px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <h1 style="color: #ef4444; margin-top: 0; font-size: 24px;">Configuration Required</h1>
            <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px;">
              The Supabase environment variables are missing. Please configure them in your <strong>Vercel Project Settings</strong>:
            </p>
            <ul style="text-align: left; color: #e4e4e7; margin: 20px 0; padding-left: 20px; font-family: monospace; font-size: 13px; line-height: 1.8;">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
            <p style="color: #71717a; font-size: 13px; margin-bottom: 0;">
              After adding them, trigger a redeployment in Vercel.
            </p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { 'content-type': 'text/html' } }
    )
  }

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const { supabaseResponse, user } = await updateSession(request)

  // Not logged in + trying to access protected route → redirect to login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Retrieve user role from cookie (set during login)
  const role = request.cookies.get('user_role')?.value ?? 'staff'

  // Logged in + on public route → redirect to appropriate dashboard
  if (user && isPublic && pathname !== '/auth/callback') {
    const destination = ROLE_ROUTES[role] ?? '/staff/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Role-based route guards — prevent staff from accessing admin routes etc.
  if (user && !isPublic) {
    // Prevent staff/manager from accessing /admin/*
    if (pathname.startsWith('/admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL(ROLE_ROUTES[role] ?? '/staff/dashboard', request.url))
    }

    // Prevent staff from accessing /manager/*
    if (pathname.startsWith('/manager') && role === 'staff') {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
