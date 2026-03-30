'use client'

import React, { useState } from 'react'
import { RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { extractInitials, platformLabel, timeAgo } from '@/lib/utils'

interface WatchlistEntry {
  id: string
  name: string
  platform: string
  url: string
  avatar_url: string | null
  last_fetched_at: string | null
  is_active: boolean
}

interface CreatorRowProps {
  entry: WatchlistEntry
  onDeleted: () => void
  onFetched: () => void
}

export function CreatorRow({ entry, onDeleted, onFetched }: CreatorRowProps) {
  const [fetching, setFetching] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleFetch() {
    setFetching(true)
    try {
      await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist_id: entry.id }),
      })
      onFetched()
    } catch {
      // ignore
    } finally {
      setFetching(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${entry.name}" from your watchlist?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/watchlist?id=${entry.id}`, { method: 'DELETE' })
      onDeleted()
    } catch {
      setDeleting(false)
    }
  }

  const initials = extractInitials(entry.name)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Avatar */}
      {entry.avatar_url ? (
        <img
          src={entry.avatar_url}
          alt={entry.name}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid var(--border)',
          }}
        />
      ) : (
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.name}
          </span>
          <Badge variant="platform" platform={entry.platform}>
            {platformLabel(entry.platform)}
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '260px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {entry.url}
            <ExternalLink size={10} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          </a>
          {entry.last_fetched_at && (
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              · fetched {timeAgo(entry.last_fetched_at)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={handleFetch}
          disabled={fetching}
          title="Fetch now"
          style={{
            background: 'none',
            border: 'none',
            cursor: fetching ? 'wait' : 'pointer',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '8px',
            transition: 'color 200ms ease, background-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            if (!fetching) {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-tertiary)'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          {fetching ? (
            <Spinner size={16} />
          ) : (
            <RefreshCw size={16} strokeWidth={1.5} />
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Remove"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '8px',
            transition: 'color 200ms ease, background-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255,59,48,0.06)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          {deleting ? <Spinner size={16} /> : <Trash2 size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}
