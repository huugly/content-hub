'use client'

import React, { useState, useEffect } from 'react'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const UTC_HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  const ampm = i < 12 ? 'AM' : 'PM'
  const display = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
  return { value: i, label: `${hour}:00 UTC (${display} UTC)` }
})

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [fetchHour, setFetchHour] = useState(5)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.fetch_hour_utc === 'number') {
          setFetchHour(data.fetch_hour_utc)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fetch_hour_utc: fetchHour }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings" width={380}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Content Fetch Schedule
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="fetch-hour"
              style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
            >
              Daily fetch time (UTC)
            </label>
            <select
              id="fetch-hour"
              value={fetchHour}
              onChange={(e) => setFetchHour(Number(e.target.value))}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '15px',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'auto',
              }}
            >
              {UTC_HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
              GitHub Actions runs every hour. It will only trigger a full fetch at your selected
              UTC hour. Changes take effect on the next hourly check.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </Sheet>
  )
}
