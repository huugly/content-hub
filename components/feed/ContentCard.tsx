'use client'

import React, { useState } from 'react'
import { ExternalLink, Plus, Check, Bookmark } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { platformLabel, timeAgo, truncate } from '@/lib/utils'

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
  watchlist: {
    name: string
    avatar_url: string | null
  }
}

interface ContentCardProps {
  item: ContentItem
  onIdeaSaved?: () => void
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'var(--yt-color)',
  x: 'var(--x-color)',
  website: 'var(--web-color)',
}

const PLATFORM_SOFT: Record<string, string> = {
  youtube: 'var(--yt-soft)',
  x: 'var(--x-soft)',
  website: 'var(--web-soft)',
}

export function ContentCard({ item, onIdeaSaved }: ContentCardProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const summary = item.content_ideas?.[0] ?? null
  const summaryPending = !item.ideas_generated_at && !item.content_ideas?.length
  const accentColor = PLATFORM_COLORS[item.platform] ?? 'var(--accent)'
  const softColor = PLATFORM_SOFT[item.platform] ?? 'var(--accent-soft)'

  async function saveToPostBuilder() {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch('/api/saved-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_item_id: item.id,
          idea_text: summary ?? item.title,
          title: truncate(item.title, 60),
          source_url: item.url,
          source_creator: item.watchlist?.name,
          platform_target: JSON.stringify(['other']),
        }),
      })
      if (res.ok) {
        setSaved(true)
        onIdeaSaved?.()
      } else {
        setSaveError(true)
      }
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: '14px 16px',
        marginBottom: '8px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* Thumbnail */}
      {item.thumbnail_url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
          <img
            src={item.thumbnail_url}
            alt={item.title}
            style={{
              width: '88px',
              height: '50px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border)',
              display: 'block',
            }}
            loading="lazy"
            onError={(e) => { ;(e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </a>
      ) : (
        <div
          style={{
            width: '88px',
            height: '50px',
            borderRadius: '8px',
            background: softColor,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}
        >
          {item.platform === 'youtube' ? '▶' : item.platform === 'x' ? '𝕏' : '◉'}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Row 1: Creator + platform badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {item.watchlist?.avatar_url && (
              <img
                src={item.watchlist.avatar_url}
                alt={item.watchlist.name}
                style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0 }}
              />
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.watchlist?.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: accentColor,
                background: softColor,
                padding: '1px 7px',
                borderRadius: '980px',
                flexShrink: 0,
              }}
            >
              {platformLabel(item.platform)}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {timeAgo(item.published_at)}
          </span>
        </div>

        {/* Row 2: Title */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4',
            letterSpacing: '-0.1px',
          }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.color = accentColor }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)' }}
        >
          {item.title}
        </a>

        {/* Row 3: Summary */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {summaryPending ? (
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Spinner size={11} />
              Summarising…
            </span>
          ) : summary ? (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
              {summary}
            </span>
          ) : item.description ? (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.description}
            </span>
          ) : null}
        </div>

        {/* Row 4: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.color = accentColor }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)' }}
          >
            View source <ExternalLink size={10} strokeWidth={1.5} />
          </a>

          <button
            onClick={saveError ? saveToPostBuilder : saved ? undefined : saveToPostBuilder}
            disabled={saving || saved}
            title={saved ? 'Saved to Post Builder' : saveError ? 'Failed — click to retry' : 'Save to Post Builder'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '980px',
              border: '1px solid',
              borderColor: saved ? 'var(--success)' : saveError ? 'var(--destructive)' : 'var(--border)',
              background: saved ? 'rgba(34,197,94,0.08)' : saveError ? 'rgba(255,59,48,0.06)' : 'transparent',
              color: saved ? 'var(--success)' : saveError ? 'var(--destructive)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: saved ? 'default' : 'pointer',
            }}
          >
            {saving ? <Spinner size={11} /> : saved ? <Check size={11} strokeWidth={2} /> : <Bookmark size={11} strokeWidth={1.5} />}
            {saving ? 'Saving…' : saved ? 'Saved' : saveError ? 'Retry' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
