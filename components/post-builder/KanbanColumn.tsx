'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Copy, Check } from 'lucide-react'
import { IdeaCard } from './IdeaCard'

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

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0a66c2',
  x: '#1a8cd8',
  youtube: '#ff2d2d',
  instagram: '#e1306c',
  newsletter: '#f97316',
  other: '#6366f1',
}

function getPlatformColor(id: string): string {
  return PLATFORM_COLORS[id] ?? '#6366f1'
}

interface KanbanColumnProps {
  platform: string
  platformLabel: string
  ideas: SavedIdea[]
  onStatusChange: (id: string, status: Status) => void
  onDeleted: (id: string) => void
  onCopyJSON: () => void
  copied: boolean
}

export function KanbanColumn({ platform, platformLabel, ideas, onStatusChange, onDeleted, onCopyJSON, copied }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: platform })
  const color = getPlatformColor(platform)

  return (
    <div style={{ width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Column header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: `${color}12`,
          border: `1px solid ${color}30`,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.1px', color: 'var(--text-primary)' }}>
            {platformLabel}
          </span>
          <span
            style={{
              backgroundColor: `${color}20`,
              color: color,
              borderRadius: '980px',
              padding: '1px 7px',
              fontSize: '11px',
              fontWeight: 700,
              lineHeight: '1.4',
            }}
          >
            {ideas.length}
          </span>
        </div>
        <button
          onClick={onCopyJSON}
          title={copied ? 'Copied!' : `Copy ${platformLabel} JSON`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? 'var(--success)' : `${color}80`,
            display: 'flex', alignItems: 'center',
            padding: '3px', borderRadius: '5px',
            transition: 'color 200ms ease',
          }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = color }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = copied ? 'var(--success)' : `${color}80` }}
        >
          {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, minHeight: '180px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          backgroundColor: isOver ? `${color}06` : 'transparent',
          borderRadius: '10px',
          border: isOver ? `1px dashed ${color}50` : '1px dashed transparent',
          padding: isOver ? '6px' : '0',
          transition: 'all 200ms ease',
        }}
      >
        <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {ideas.length === 0 ? (
            <div
              style={{
                padding: '24px 16px', textAlign: 'center', fontSize: '12px',
                color: 'var(--text-tertiary)', border: '1px dashed var(--border)',
                borderRadius: '10px',
              }}
            >
              Drop content here
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                accentColor={color}
                onStatusChange={onStatusChange}
                onDeleted={onDeleted}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
