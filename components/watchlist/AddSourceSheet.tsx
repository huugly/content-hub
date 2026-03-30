'use client'

import React, { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Platform = 'youtube' | 'x' | 'website'

interface AddSourceSheetProps {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

const PLATFORM_HELP: Record<Platform, { label: string; placeholder: string; hint: string }> = {
  youtube: {
    label: 'Channel URL or handle',
    placeholder: 'https://youtube.com/@channelname',
    hint: 'Enter a YouTube channel URL, handle (@name), or channel ID.',
  },
  x: {
    label: 'X profile URL',
    placeholder: 'https://x.com/username',
    hint: 'Fetching uses RSSHub. Requires a public or self-hosted RSSHub instance.',
  },
  website: {
    label: 'Website or RSS URL',
    placeholder: 'https://example.com',
    hint: 'RSS/Atom feeds are auto-discovered. You can also paste the feed URL directly.',
  },
}

const X_WARNING = '⚠️ X/Twitter requires a self-hosted RSSHub instance with Twitter API credentials. Set RSSHUB_BASE_URL in your .env.local. The public rsshub.app no longer works for Twitter.'

export function AddSourceSheet({ open, onClose, onAdded }: AddSourceSheetProps) {
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const help = PLATFORM_HELP[platform]

  function reset() {
    setUrl('')
    setName('')
    setError(null)
    setSuccess(false)
    setLoading(false)
  }

  function handlePlatformChange(p: Platform) {
    setPlatform(p)
    setUrl('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url: url.trim(), name: name.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
      onAdded()

      setTimeout(() => {
        onClose()
        reset()
      }, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onClose={() => { onClose(); reset() }} title="Add source">
      {success ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 199, 89, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Source added!
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Closing…</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Platform selector */}
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Platform
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['youtube', 'x', 'website'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '980px',
                    border: '1px solid',
                    borderColor: platform === p ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: platform === p ? 'rgba(0,113,227,0.08)' : 'transparent',
                    color: platform === p ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontWeight: platform === p ? 500 : 400,
                  }}
                >
                  {p === 'youtube' ? 'YouTube' : p === 'x' ? 'X' : 'Website'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px', lineHeight: '1.5' }}>
              {help.hint}
            </p>
            {platform === 'x' && (
              <p style={{
                fontSize: '12px', color: 'var(--warning)', marginTop: '6px', lineHeight: '1.5',
                backgroundColor: 'rgba(245,158,11,0.08)', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                {X_WARNING}
              </p>
            )}
          </div>

          {/* URL input */}
          <Input
            label={help.label}
            id="source-url"
            type={platform === 'youtube' ? 'text' : 'url'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={help.placeholder}
            required
          />

          {/* Display name */}
          <Input
            label="Display name (optional)"
            id="source-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={platform === 'youtube' ? 'Auto-detected from YouTube' : 'Name this source'}
          />

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--destructive)', lineHeight: '1.5' }}>
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={loading || !url.trim()}>
            {loading ? 'Adding…' : 'Add to watchlist'}
          </Button>
        </form>
      )}
    </Sheet>
  )
}
