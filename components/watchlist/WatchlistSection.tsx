'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { CreatorRow } from './CreatorRow'

interface WatchlistEntry {
  id: string
  name: string
  platform: string
  url: string
  avatar_url: string | null
  last_fetched_at: string | null
  is_active: boolean
}

interface WatchlistSectionProps {
  platform: string
  label: string
  entries: WatchlistEntry[]
  onAddClick: () => void
  onDeleted: () => void
  onFetched: () => void
}

export function WatchlistSection({
  platform,
  label,
  entries,
  onAddClick,
  onDeleted,
  onFetched,
}: WatchlistSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label} ({entries.length})
        </span>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            No sources yet
          </span>
          <button
            onClick={onAddClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              padding: '6px 8px',
              borderRadius: '8px',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(0,113,227,0.06)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            <Plus size={14} strokeWidth={1.5} />
            Add {label}
          </button>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <CreatorRow
              key={entry.id}
              entry={entry}
              onDeleted={onDeleted}
              onFetched={onFetched}
            />
          ))}
        </div>
      )}
    </div>
  )
}
