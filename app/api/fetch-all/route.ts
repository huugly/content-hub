import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, getOwnerUserId, AuthError } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const { userId, isCron } = await requireAuth(request)

    const admin = getAdminClient()

    // For cron: check if current UTC hour matches schedule
    if (isCron) {
      const currentHour = new Date().getUTCHours()
      const { data: settingsRows } = await admin.from('settings').select('fetch_hour_utc').limit(1)
      if (settingsRows && settingsRows.length > 0) {
        const setting = settingsRows[0]
        if (setting.fetch_hour_utc !== currentHour) {
          return NextResponse.json({
            skipped: true,
            reason: `not scheduled hour (current: ${currentHour} UTC, scheduled: ${setting.fetch_hour_utc} UTC)`,
          })
        }
      }
    }

    // Resolve target user: for cron look up owner, for browser request use userId from requireAuth
    const targetUserId = isCron ? await getOwnerUserId() : userId

    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    const { data: entries, error } = await admin
      .from('watchlist')
      .select('id, platform, feed_url, name')
      .eq('user_id', targetUserId)
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ message: 'No active watchlist entries', fetched: 0 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const results: Array<{ id: string; name: string; result: unknown }> = []

    for (const entry of entries) {
      try {
        const res = await fetch(`${appUrl}/api/fetch-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': process.env.CRON_SECRET ?? '',
          },
          body: JSON.stringify({ watchlist_id: entry.id }),
        })
        const result = await res.json()
        results.push({ id: entry.id, name: entry.name, result })
      } catch (err) {
        results.push({ id: entry.id, name: entry.name, result: { error: String(err) } })
      }
    }

    return NextResponse.json({
      fetched: entries.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[fetch-all] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
