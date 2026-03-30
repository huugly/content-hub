import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Validate a request has either:
 * 1. A valid authenticated session (from browser)
 * 2. A valid x-cron-secret header (from GitHub Actions)
 *
 * Returns the user_id if authenticated via session, or null for cron secret auth.
 * Throws AuthError if neither is valid.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string | null; isCron: boolean }> {
  // Check cron secret first (used by GitHub Actions)
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return { userId: null, isCron: true }
  }

  // Check session auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op in API routes
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError('Unauthorized', 401)
  }

  const ownerEmail = process.env.OWNER_EMAIL
  if (ownerEmail && user.email !== ownerEmail) {
    throw new AuthError('Forbidden', 403)
  }

  return { userId: user.id, isCron: false }
}

/**
 * Get user ID from session for API routes.
 */
export async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Create a Supabase admin client (bypasses RLS, use carefully).
 */
export function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
