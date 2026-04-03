'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from 'lucide-react'
import { KanbanColumn } from '@/components/post-builder/KanbanColumn'
import { truncate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

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
  content_items?: {
    title: string
    url: string
    platform: string
    published_at: string | null
  }
}

interface PlatformDef {
  id: string
  label: string
  isDefault: boolean
}

const DEFAULT_PLATFORMS: PlatformDef[] = [
  { id: 'linkedin', label: 'LinkedIn', isDefault: true },
  { id: 'x', label: 'X', isDefault: true },
  { id: 'youtube', label: 'YouTube', isDefault: true },
  { id: 'instagram', label: 'Instagram', isDefault: true },
  { id: 'newsletter', label: 'Newsletter', isDefault: true },
  { id: 'other', label: 'Other', isDefault: true },
]

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

// Parse platform_target which may be a JSON array string or a single string
function parsePlatforms(pt: string | null | undefined): string[] {
  if (!pt) return ['other']
  try {
    const parsed = JSON.parse(pt)
    if (Array.isArray(parsed)) return parsed.length ? parsed : ['other']
  } catch {}
  return [pt]
}

function serializePlatforms(platforms: string[]): string {
  return JSON.stringify(platforms)
}

async function fetchIdeas(): Promise<SavedIdea[]> {
  const res = await fetch('/api/saved-ideas')
  if (!res.ok) throw new Error('Failed to fetch ideas')
  return res.json()
}

// ── Manage Platforms Modal ────────────────────────────────────────────────────
function ManagePlatformsModal({
  platforms,
  onSave,
  onClose,
}: {
  platforms: PlatformDef[]
  onSave: (platforms: PlatformDef[]) => void
  onClose: () => void
}) {
  const [list, setList] = useState<PlatformDef[]>(platforms)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  function addPlatform() {
    const label = newLabel.trim()
    if (!label) return
    const id = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (list.find((p) => p.id === id)) return
    setList([...list, { id, label, isDefault: false }])
    setNewLabel('')
  }

  function deletePlatform(id: string) {
    setList(list.filter((p) => p.id !== id))
  }

  function startEdit(p: PlatformDef) {
    setEditingId(p.id)
    setEditLabel(p.label)
  }

  function commitEdit(id: string) {
    const label = editLabel.trim()
    if (!label) { setEditingId(null); return }
    setList(list.map((p) => p.id === id ? { ...p, label } : p))
    setEditingId(null)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          width: '420px',
          maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Manage Platforms</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', maxHeight: '320px', overflowY: 'auto' }}>
          {list.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div
                style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: getPlatformColor(p.id),
                }}
              />
              {editingId === p.id ? (
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(p.id); if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus
                  style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--accent)',
                    borderRadius: '6px', padding: '3px 8px', fontSize: '14px', color: 'var(--text-primary)',
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{p.label}</span>
              )}
              {editingId === p.id ? (
                <button onClick={() => commitEdit(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '2px' }}>
                  <Check size={14} strokeWidth={2} />
                </button>
              ) : (
                <button onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }}>
                  <Pencil size={13} strokeWidth={1.5} />
                </button>
              )}
              {!p.isDefault && (
                <button onClick={() => deletePlatform(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }}
                  onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)' }}
                  onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addPlatform() }}
            placeholder="Add platform (e.g. Threads, IG Story…)"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '14px',
            }}
          />
          <button
            onClick={addPlatform}
            disabled={!newLabel.trim()}
            style={{
              padding: '9px 14px', borderRadius: '10px',
              background: newLabel.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: newLabel.trim() ? '#fff' : 'var(--text-tertiary)',
              border: 'none', cursor: newLabel.trim() ? 'pointer' : 'default',
              fontWeight: 500, fontSize: '13px',
            }}
          >
            Add
          </button>
        </div>

        <button
          onClick={() => onSave(list)}
          style={{
            width: '100%', padding: '11px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ── Shortlist Card ────────────────────────────────────────────────────────────
function IdeaListCard({
  idea,
  allPlatforms,
  onPlatformsChange,
  onDeleted,
}: {
  idea: SavedIdea
  allPlatforms: PlatformDef[]
  onPlatformsChange: (id: string, platforms: string[]) => void
  onDeleted: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const selectedPlatforms = parsePlatforms(idea.platform_target)

  function togglePlatform(pid: string) {
    const current = parsePlatforms(idea.platform_target)
    const next = current.includes(pid)
      ? current.filter((p) => p !== pid)
      : [...current, pid]
    onPlatformsChange(idea.id, next.length ? next : ['other'])
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
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '5px' }}>
            {idea.title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {idea.idea_text}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px', flexShrink: 0 }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)' }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
        >
          {deleting ? <Spinner size={13} /> : <Trash2 size={13} strokeWidth={1.5} />}
        </button>
      </div>

      {idea.source_creator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <span>From: {truncate(idea.source_creator, 40)}</span>
          {idea.source_url && (
            <a href={idea.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
              <ExternalLink size={10} strokeWidth={1.5} />
            </a>
          )}
        </div>
      )}

      {/* Platform multi-select */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
          Add to platforms
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {allPlatforms.map((p) => {
            const isSelected = selectedPlatforms.includes(p.id)
            const color = getPlatformColor(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                style={{
                  padding: '4px 11px',
                  borderRadius: '980px',
                  border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                  backgroundColor: isSelected ? `${color}18` : 'transparent',
                  color: isSelected ? color : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isSelected && <Check size={10} strokeWidth={2.5} />}
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PostBuilderPage() {
  const { data: ideas = [], mutate } = useSWR<SavedIdea[]>('saved-ideas', fetchIdeas, {
    revalidateOnFocus: false,
  })

  const [view, setView] = useState<'list' | 'board'>('list')
  const [platforms, setPlatforms] = useState<PlatformDef[]>(DEFAULT_PLATFORMS)
  const [showManage, setShowManage] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)

  // Load custom platforms from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ch_platforms')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setPlatforms(parsed)
      }
    } catch {}
  }, [])

  function savePlatforms(updated: PlatformDef[]) {
    setPlatforms(updated)
    localStorage.setItem('ch_platforms', JSON.stringify(updated))
    setShowManage(false)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const visiblePlatforms = platformFilter === 'all'
    ? platforms
    : platforms.filter((p) => p.id === platformFilter)

  // For board: idea appears in a column if its platform_target array includes that platform
  function getIdeasForPlatform(platform: string): SavedIdea[] {
    return ideas.filter((idea) => parsePlatforms(idea.platform_target).includes(platform))
  }

  async function handlePlatformsChange(id: string, newPlatforms: string[]) {
    const serialized = serializePlatforms(newPlatforms)
    mutate(ideas.map((idea) => idea.id === id ? { ...idea, platform_target: serialized } : idea), false)
    fetch(`/api/saved-ideas?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform_target: serialized }),
    })
  }

  async function handleStatusChange(id: string, status: Status) {
    mutate(ideas.map((idea) => idea.id === id ? { ...idea, status } : idea), false)
    fetch(`/api/saved-ideas?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDeleted(id: string) {
    mutate(ideas.filter((idea) => idea.id !== id), false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const draggedId = active.id as string
    const overId = over.id as string
    const platformIds = platforms.map((p) => p.id)
    let targetPlatform: string | null = null
    if (platformIds.includes(overId)) {
      targetPlatform = overId
    } else {
      const overCard = ideas.find((i) => i.id === overId)
      if (overCard) {
        const overPlatforms = parsePlatforms(overCard.platform_target)
        targetPlatform = overPlatforms[0] ?? null
      }
    }
    if (!targetPlatform) return
    // Dragging sets the platform to just the dropped column
    await handlePlatformsChange(draggedId, [targetPlatform])
  }

  function copyPlatformJSON(platform: string) {
    const platformIdeas = ideas.filter((idea) => parsePlatforms(idea.platform_target).includes(platform))
    const payload = {
      platform,
      ideas: platformIdeas.map((idea) => ({
        idea: idea.idea_text,
        status: idea.status,
        source: { creator: idea.source_creator, title: idea.title, url: idea.source_url },
      })),
    }
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 1500)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
      {showManage && (
        <ManagePlatformsModal
          platforms={platforms}
          onSave={savePlatforms}
          onClose={() => setShowManage(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Post Builder</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Manage platforms button */}
          <button
            onClick={() => setShowManage(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 12px', borderRadius: '9px',
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Pencil size={13} strokeWidth={1.5} />
            Platforms
          </button>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-secondary)', borderRadius: '9px', padding: '3px' }}>
            {(['list', 'board'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 14px', borderRadius: '7px', border: 'none',
                  backgroundColor: view === v ? 'var(--bg-card)' : 'transparent',
                  color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: view === v ? 600 : 400,
                  cursor: 'pointer',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {v === 'list' ? 'Shortlist' : 'Board'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        /* ── SHORTLIST VIEW ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ideas.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
              No ideas saved yet. Go to Feed and save content to see it here.
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaListCard
                key={idea.id}
                idea={idea}
                allPlatforms={platforms}
                onPlatformsChange={handlePlatformsChange}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </div>
      ) : (
        /* ── BOARD VIEW ── */
        <>
          {/* Platform filter pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['all', ...platforms.map((p) => p.id)] as const).map((pid) => {
              const label = pid === 'all' ? 'All' : (platforms.find((p) => p.id === pid)?.label ?? pid)
              const color = pid !== 'all' ? getPlatformColor(pid) : undefined
              const isActive = platformFilter === pid
              return (
                <button
                  key={pid}
                  onClick={() => setPlatformFilter(pid)}
                  style={{
                    padding: '5px 12px', borderRadius: '980px',
                    border: `1px solid ${isActive && color ? color : isActive ? 'var(--accent)' : 'var(--border)'}`,
                    backgroundColor: isActive
                      ? color ? `${color}15` : 'var(--accent-soft)'
                      : 'var(--bg-secondary)',
                    color: isActive ? (color ?? 'var(--accent)') : 'var(--text-secondary)',
                    fontSize: '13px', cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 150ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Kanban board */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
              {visiblePlatforms.map((platform) => (
                <KanbanColumn
                  key={platform.id}
                  platform={platform.id}
                  platformLabel={platform.label}
                  ideas={getIdeasForPlatform(platform.id)}
                  onStatusChange={handleStatusChange}
                  onDeleted={handleDeleted}
                  onCopyJSON={() => copyPlatformJSON(platform.id)}
                  copied={copiedPlatform === platform.id}
                />
              ))}
            </div>
          </DndContext>
        </>
      )}
    </div>
  )
}
