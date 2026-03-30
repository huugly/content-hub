import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page, auth callbacks, and API routes through without middleware auth check
  // API routes do their own auth via requireAuth()
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/')
  ) {
    return await updateSession(request).then((r) => r.supabaseResponse)
  }

  const { supabaseResponse, user } = await updateSession(request)

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated but wrong email — reject silently (redirect to login)
  const ownerEmail = process.env.OWNER_EMAIL
  if (ownerEmail && user.email !== ownerEmail) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
