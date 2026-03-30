import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, getSessionUserId, AuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { userId, isCron } = await requireAuth(request)

    const admin = getAdminClient()
    let targetUserId = userId

    if (isCron || !targetUserId) {
      const sessionId = await getSessionUserId(request)
      if (!sessionId) {
        // For cron: get first user
        const { data: profiles } = await admin.from('profiles').select('id').limit(1)
        targetUserId = profiles?.[0]?.id ?? null
      } else {
        targetUserId = sessionId
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('settings')
      .select('fetch_hour_utc')
      .eq('user_id', targetUserId)
      .single()

    if (error) {
      // Return defaults if no settings row yet
      return NextResponse.json({ fetch_hour_utc: 5 })
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)

    const body = await request.json()
    const { fetch_hour_utc } = body as { fetch_hour_utc: number }

    if (typeof fetch_hour_utc !== 'number' || fetch_hour_utc < 0 || fetch_hour_utc > 23) {
      return NextResponse.json({ error: 'fetch_hour_utc must be 0-23' }, { status: 400 })
    }

    const admin = getAdminClient()

    let targetUserId = userId
    if (!targetUserId) {
      const sessionId = await getSessionUserId(request)
      targetUserId = sessionId
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }

    const { error } = await admin
      .from('settings')
      .upsert(
        { user_id: targetUserId, fetch_hour_utc, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, fetch_hour_utc })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
