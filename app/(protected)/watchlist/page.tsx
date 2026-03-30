'use client'

import React, { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WatchlistSection } from '@/components/watchlist/WatchlistSection'
import { AddSourceSheet } from '@/components/watchlist/AddSourceSheet'
import { createClient } from '@/lib/supabase/client'

interface WatchlistEntry {
  id: string
  name: string
  platform: string
  url: string
  avatar_url: string | null
  last_fetched_at: string | null
  is_active: boolean
}

async function fetchWatchlist(): Promise<WatchlistEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export default function WatchlistPage() {
  const { data: entries = [], mutate } = useSWR<WatchlistEntry[]>('watchlist', fetchWatchlist)
  const [sheetOpen, setSheetOpen] = useState(false)

  const youtube = entries.filter((e) => e.platform === 'youtube')
  const x = entries.filter((e) => e.platform === 'x')
  const websites = entries.filter((e) => e.platform === 'website')

  const refresh = useCallback(() => mutate(), [mutate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Watchlist</h1>
        <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
          <Plus size={15} strokeWidth={1.5} />
          Add source
        </Button>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <WatchlistSection
          platform="youtube"
          label="YouTube"
          entries={youtube}
          onAddClick={() => setSheetOpen(true)}
          onDeleted={refresh}
          onFetched={refresh}
        />
        <WatchlistSection
          platform="x"
          label="X"
          entries={x}
          onAddClick={() => setSheetOpen(true)}
          onDeleted={refresh}
          onFetched={refresh}
        />
        <WatchlistSection
          platform="website"
          label="Websites"
          entries={websites}
          onAddClick={() => setSheetOpen(true)}
          onDeleted={refresh}
          onFetched={refresh}
        />
      </div>

      <AddSourceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={refresh}
      />
    </div>
  )
}
