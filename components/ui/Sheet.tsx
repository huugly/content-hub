'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: number
}

export function Sheet({ open, onClose, title, children, width = 420 }: SheetProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100vw)`,
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          transform: open ? 'translateX(0)' : `translateX(${width}px)`,
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.2px',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</div>
      </div>
    </>
  )
}
