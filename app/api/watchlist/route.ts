import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, getSessionUserId, AuthError } from '@/lib/auth-helpers'
import { resolveYouTubeChannel } from '@/lib/fetchers/youtube'
import { buildXFeedUrl } from '@/lib/fetchers/x-rss'
import { discoverFeedUrl } from '@/lib/fetchers/website'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, isCron } = await requireAuth(request)
    const admin = getAdminClient()

    let targetUserId = userId
    if (!targetUserId) {
      targetUserId = await getSessionUserId(request)
    }
    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, url, name } = body as {
      platform: 'youtube' | 'x' | 'website'
      url: string
      name?: string
    }

    if (!platform || !url) {
      return NextResponse.json({ error: 'platform and url required' }, { status: 400 })
    }

    let resolvedName = name ?? url
    let feedUrl: string | null = null
    let avatarUrl: string | null = null

    if (platform === 'youtube') {
      const channelInfo = await resolveYouTubeChannel(url)
      resolvedName = name ?? channelInfo.name
      feedUrl = channelInfo.feed_url
      avatarUrl = channelInfo.avatar_url
    } else if (platform === 'x') {
      feedUrl = buildXFeedUrl(url)
      resolvedName = name ?? url
    } else if (platform === 'website') {
      // Try provided URL as feed first, then auto-discover
      feedUrl = url.includes('feed') || url.includes('rss') || url.includes('atom')
        ? url
        : await discoverFeedUrl(url)
      resolvedName = name ?? new URL(url).hostname
    }

    const { data, error } = await admin
      .from('watchlist')
      .insert({
        user_id: targetUserId,
        name: resolvedName,
        platform,
        url,
        feed_url: feedUrl,
        avatar_url: avatarUrl,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[watchlist POST] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()

    let targetUserId = userId
    if (!targetUserId) {
      targetUserId = await getSessionUserId(request)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { error } = await admin
      .from('watchlist')
      .delete()
      .eq('id', id)
      .eq('user_id', targetUserId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
