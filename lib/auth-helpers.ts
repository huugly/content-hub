import { NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Module-level cache — persists within a warm serverless instance
let _cachedOwnerId: string | null | undefined = undefined

/**
 * Look up the owner's Supabase user ID by OWNER_EMAIL.
 * Result is cached in-memory for the lifetime of the serverless instance.
 */
export async function getOwnerUserId(): Promise<string | null> {
  if (_cachedOwnerId !== undefined) return _cachedOwnerId

  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) {
    _cachedOwnerId = null
    return null
  }

  const admin = getAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const owner = data?.users?.find((u: { email?: string }) => u.email === ownerEmail)
  _cachedOwnerId = owner?.id ?? null
  return _cachedOwnerId
}

/**
 * No-op auth — always returns the owner's user ID (or cron if secret present).
 * No login is required to access the app.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId: string | null; isCron: boolean }> {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return { userId: null, isCron: true }
  }

  const userId = await getOwnerUserId()
  return { userId, isCron: false }
}

/**
 * Returns the owner's user ID (no session needed).
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
