'use client'

import React, { useState } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactElement
  position?: 'top' | 'bottom'
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {React.cloneElement(children, {
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
      })}
      {visible && (
        <span
          style={{
            position: 'absolute',
            [position === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

// Inline "Copied!" tooltip — shows for 1.5s then disappears
export function useCopyTooltip() {
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return { copied, copy }
}
