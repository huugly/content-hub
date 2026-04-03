import { NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Get owner's user ID from Supabase (looked up by OWNER_EMAIL).
 * Auth is disabled — this always returns the owner's ID.
 */
async function getOwnerUserId(): Promise<string | null> {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) return null

  const admin = getAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const owner = data?.users?.find((u: { email?: string }) => u.email === ownerEmail)
  return owner?.id ?? null
}

/**
 * No-op auth — always returns the owner's user ID (or cron if secret present).
 * Login is not required to access the app.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string | null; isCron: boolean }> {
  // Check cron secret (used by GitHub Actions)
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return { userId: null, isCron: true }
  }

  const userId = await getOwnerUserId()
  return { userId, isCron: false }
}

/**
 * Returns the owner's user ID directly (no session needed).
 */
export async function getSessionUserId(_request: NextRequest): Promise<string | null> {
  return getOwnerUserId()
}

/**
 * Create a Supabase admin client (bypasses RLS).
 */
export function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
