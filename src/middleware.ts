import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback']

// Role → default route mapping
const ROLE_ROUTES: Record<string, string> = {
  super_admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  staff: '/staff/dashboard',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Not logged in + trying to access protected route → redirect to login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in + on public route → redirect to appropriate dashboard
  if (user && isPublic && pathname !== '/auth/callback') {
    // Fetch employee role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const role = employee?.role ?? 'staff'
    const destination = ROLE_ROUTES[role] ?? '/staff/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Role-based route guards — prevent staff from accessing admin routes etc.
  if (user && !isPublic) {
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const role = employee?.role ?? 'staff'

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
