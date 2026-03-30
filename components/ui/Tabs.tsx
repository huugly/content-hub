'use client'

import React from 'react'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '10px 16px',
              fontSize: '15px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 200ms ease, border-color 200ms ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-tertiary)',
                  borderRadius: '980px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
