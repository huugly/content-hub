import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, AuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const admin = getAdminClient()

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const countOnly = searchParams.get('count') === 'true'

    if (countOnly) {
      if (platform) {
        const { count, error } = await admin
          .from('content_items')
          .select('id', { count: 'exact', head: true })
          .eq('platform', platform)
          .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ count: count ?? 0 })
      }
      const { count, error } = await admin
        .from('watchlist')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ count: count ?? 0 })
    }

    let query = admin
      .from('content_items')
      .select('*, watchlist(name, avatar_url)')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(100)

    if (platform) query = query.eq('platform', platform)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
