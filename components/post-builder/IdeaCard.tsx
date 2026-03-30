'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, Copy, Trash2, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { truncate } from '@/lib/utils'

type Status = 'backlog' | 'in_progress' | 'done'

interface SavedIdea {
  id: string
  title: string
  idea_text: string
  source_url: string | null
  source_creator: string | null
  platform_target: string
  status: Status
  created_at: string
}

interface IdeaCardProps {
  idea: SavedIdea
  accentColor: string
  onStatusChange: (id: string, status: Status) => void
  onDeleted: (id: string) => void
}

const STATUS_CYCLE: Status[] = ['backlog', 'in_progress', 'done']
const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: 'var(--text-secondary)', bg: 'var(--bg-tertiary)' },
  in_progress: { label: 'In Progress', color: 'var(--warning)',        bg: 'rgba(245,158,11,0.12)' },
  done:        { label: 'Done',        color: 'var(--success)',        bg: 'rgba(34,197,94,0.12)' },
}

export function IdeaCard({ idea, accentColor, onStatusChange, onDeleted }: IdeaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id })
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const statusMeta = STATUS_META[idea.status]

  function cycleStatus() {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(idea.status) + 1) % STATUS_CYCLE.length]
    onStatusChange(idea.id, next)
  }

  function copySingleCard() {
    const json = JSON.stringify({ idea: idea.idea_text, status: idea.status, source: { creator: idea.source_creator, url: idea.source_url } }, null, 2)
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/saved-ideas?id=${idea.id}`, { method: 'DELETE' })
      onDeleted(idea.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${accentColor}`,
        borderRadius: '10px',
        padding: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 200ms ease',
      }}
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {idea.title}
      </div>

      {/* Idea text */}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {idea.idea_text}
      </div>

      {/* Source */}
      {idea.source_creator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          <span>{truncate(idea.source_creator, 28)}</span>
          {idea.source_url && (
            <a href={idea.source_url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <ExternalLink size={9} strokeWidth={1.5} />
            </a>
          )}
        </div>
      )}

      {/* Footer: status + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}
        onMouseDown={(e) => e.stopPropagation()}>
        {/* Status pill */}
        <button
          onClick={cycleStatus}
          style={{
            background: statusMeta.bg, border: 'none', padding: '3px 9px',
            borderRadius: '980px', cursor: 'pointer',
            fontSize: '11px', fontWeight: 600, color: statusMeta.color,
          }}
        >
          {statusMeta.label}
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1px' }}>
          <button onClick={copySingleCard} title={copied ? 'Copied!' : 'Copy'}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: copied ? 'var(--success)' : 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', padding: '5px', borderRadius: '6px' }}>
            {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
          </button>
          <button onClick={handleDelete} disabled={deleting} title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', padding: '5px', borderRadius: '6px' }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)' }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}>
            {deleting ? <Spinner size={12} /> : <Trash2 size={12} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </div>
  )
}
