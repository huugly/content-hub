'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { Spinner } from '@/components/ui/Spinner'
import { ContentCard } from '@/components/feed/ContentCard'
import { EmptyFeed } from '@/components/feed/EmptyFeed'
import { createClient } from '@/lib/supabase/client'
import { isWithinDays } from '@/lib/utils'

type Platform = 'youtube' | 'x' | 'website'

interface ContentItem {
  id: string
  title: string
  description: string | null
  url: string
  thumbnail_url: string | null
  published_at: string | null
  platform: string
  content_ideas: string[] | null
  ideas_generated_at: string | null
  fetched_at: string
  watchlist: { name: string; avatar_url: string | null }
}

async function fetchFeedData(platform: Platform): Promise<ContentItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*, watchlist(name, avatar_url)')
    .eq('platform', platform)
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('published_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as ContentItem[]
}

async function fetchWatchlistCount() {
  const supabase = createClient()
  const { count } = await supabase
    .from('watchlist')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  return count ?? 0
}

async function fetchCountByPlatform(platform: Platform): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platform)
    .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  return count ?? 0
}

function FeedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const platformParam = (searchParams.get('platform') as Platform) ?? 'youtube'
  const [activePlatform, setActivePlatform] = useState<Platform>(platformParam)
  const [refreshing, setRefreshing] = useState(false)
  const hasAutoFetched = useRef(false)
  const ideaFetchRef = useRef<Set<string>>(new Set())

  const { data: items = [], mutate, isLoading } = useSWR<ContentItem[]>(
    ['feed', activePlatform],
    () => fetchFeedData(activePlatform),
    { revalidateOnFocus: false }
  )

  const { data: watchlistCount = 0 } = useSWR('watchlist-count', fetchWatchlistCount)
  const { data: ytCount = 0 } = useSWR('feed-count-youtube', () => fetchCountByPlatform('youtube'))
  const { data: xCount = 0 } = useSWR('feed-count-x', () => fetchCountByPlatform('x'))
  const { data: webCount = 0 } = useSWR('feed-count-website', () => fetchCountByPlatform('website'))

  // Auto-trigger fetch if no recent content
  useEffect(() => {
    if (hasAutoFetched.current) return
    if (watchlistCount === 0) return
    if (isLoading) return
    const hasRecentContent = items.some((item) => isWithinDays(item.fetched_at, 1))
    if (!hasRecentContent && items.length === 0) {
      hasAutoFetched.current = true
      triggerFetchAll()
    }
  }, [items, watchlistCount, isLoading])

  // Trigger summary generation for items missing summaries
  useEffect(() => {
    const pendingIds = items
      .filter((item) =>
        !item.ideas_generated_at &&
        !item.content_ideas?.length &&
        !ideaFetchRef.current.has(item.id)
      )
      .map((item) => item.id)

    if (pendingIds.length > 0) {
      pendingIds.forEach((id) => ideaFetchRef.current.add(id))
      fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: pendingIds }),
      }).then(() => mutate())
    }
  }, [items, mutate])

  async function triggerFetchAll() {
    setRefreshing(true)
    try {
      await fetch('/api/fetch-all', { method: 'POST' })
      await mutate()
    } catch {
      // ignore
    } finally {
      setRefreshing(false)
    }
  }

  function handleTabChange(id: string) {
    setActivePlatform(id as Platform)
    router.replace(`/feed?platform=${id}`)
  }

  const tabs = [
    { id: 'youtube', label: 'YouTube', count: ytCount },
    { id: 'x', label: 'X', count: xCount },
    { id: 'website', label: 'Websites', count: webCount },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1>Feed</h1>
        <button
          onClick={triggerFetchAll}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: refreshing ? 'var(--accent-soft)' : 'var(--bg-card)',
            color: refreshing ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: refreshing ? 'wait' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {refreshing ? <Spinner size={13} /> : <RefreshCw size={13} strokeWidth={2} />}
          {refreshing ? 'Fetching…' : 'Fetch last 7 days'}
        </button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activePlatform} onChange={handleTabChange} />

      {/* Content */}
      <div style={{ marginTop: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <Spinner size={20} color="var(--text-secondary)" />
          </div>
        ) : items.length === 0 ? (
          <EmptyFeed hasWatchlistEntries={watchlistCount > 0} />
        ) : (
          <div className="fade-in">
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="section-label">Last 7 days</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
                background: 'var(--accent-soft)', padding: '1px 7px', borderRadius: '980px',
              }}>
                {items.length}
              </span>
            </div>
            {items.map((item) => (
              <ContentCard key={item.id} item={item} onIdeaSaved={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Spinner size={20} color="var(--text-secondary)" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}
