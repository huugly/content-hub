import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, AuthError } from '@/lib/auth-helpers'
import { fetchYouTubeItems } from '@/lib/fetchers/youtube'
import { fetchXItems } from '@/lib/fetchers/x-rss'
import { fetchWebsiteItems } from '@/lib/fetchers/website'

export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId, isCron } = await requireAuth(request)

    const body = await request.json()
    const { watchlist_id } = body as { watchlist_id: string }

    if (!watchlist_id) {
      return NextResponse.json({ error: 'watchlist_id required' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Fetch the watchlist entry
    const { data: entry, error: entryError } = await admin
      .from('watchlist')
      .select('*')
      .eq('id', watchlist_id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Watchlist entry not found' }, { status: 404 })
    }

    // Verify ownership for non-cron requests
    if (!isCron && authUserId && entry.user_id !== authUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!entry.feed_url) {
      return NextResponse.json({ error: 'No feed URL configured' }, { status: 400 })
    }

    // Fetch items based on platform
    type RawItem = {
      external_id: string
      title: string
      description: string | null
      url: string
      thumbnail_url: string | null
      published_at: string | null
    }

    let rawItems: RawItem[] = []

    try {
      if (entry.platform === 'youtube') {
        rawItems = await fetchYouTubeItems(entry.feed_url)
      } else if (entry.platform === 'x') {
        rawItems = await fetchXItems(entry.feed_url)
      } else if (entry.platform === 'website') {
        rawItems = await fetchWebsiteItems(entry.feed_url)
      }
    } catch (fetchErr) {
      console.error(`[fetch-content] Failed to fetch ${entry.platform} feed:`, fetchErr)
      return NextResponse.json(
        { error: 'Feed fetch failed', detail: String(fetchErr) },
        { status: 502 }
      )
    }

    // Upsert items — deduplicate by (watchlist_id, external_id)
    let inserted = 0
    let skipped = 0

    for (const item of rawItems) {
      const record = {
        user_id: entry.user_id,
        watchlist_id: entry.id,
        external_id: item.external_id,
        title: item.title,
        description: item.description,
        url: item.url,
        thumbnail_url: item.thumbnail_url,
        published_at: item.published_at,
        platform: entry.platform,
      }

      const { error: upsertError } = await admin
        .from('content_items')
        .upsert(record, { onConflict: 'watchlist_id,external_id', ignoreDuplicates: true })

      if (upsertError) {
        // Conflict = duplicate = skipped
        skipped++
      } else {
        inserted++
      }
    }

    // Update last_fetched_at
    await admin
      .from('watchlist')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', watchlist_id)

    return NextResponse.json({ inserted, skipped, total: rawItems.length })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[fetch-content] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
