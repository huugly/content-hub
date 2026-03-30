import React from 'react'
import { Rss } from 'lucide-react'
import Link from 'next/link'

interface EmptyFeedProps {
  hasWatchlistEntries?: boolean
}

export function EmptyFeed({ hasWatchlistEntries = true }: EmptyFeedProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        gap: '12px',
      }}
    >
      <Rss size={32} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
        No content yet
      </div>
      <div
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          maxWidth: '280px',
        }}
      >
        {hasWatchlistEntries
          ? 'Click "Refresh" to fetch the latest content from your watchlist.'
          : 'Add sources in Watchlist to get started.'}
      </div>
      {!hasWatchlistEntries && (
        <Link
          href="/watchlist"
          style={{
            marginTop: '8px',
            backgroundColor: 'var(--accent)',
            color: 'white',
            borderRadius: '980px',
            padding: '8px 18px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 200ms ease',
          }}
        >
          Go to Watchlist
        </Link>
      )}
    </div>
  )
}
