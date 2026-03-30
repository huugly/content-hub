'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Rss, LayoutGrid, LogOut, Settings, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { signOut } from '@/app/login/actions'
import { extractInitials } from '@/lib/utils'
import { SettingsPanel } from './SettingsPanel'

interface SidebarProps {
  email: string
}

const navItems = [
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/post-builder', label: 'Post Builder', icon: LayoutGrid },
]

export function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const initials = extractInitials(email.split('@')[0])

  return (
    <>
      <aside
        style={{
          width: collapsed ? '60px' : '220px',
          minHeight: '100dvh',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 200ms ease',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          overflow: 'hidden',
          boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Gradient accent bar at top */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent) 0%, #ec4899 50%, var(--warning) 100%)', flexShrink: 0 }} />
        {/* Logo area */}
        <div
          style={{
            padding: collapsed ? '20px 0' : '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border)',
            minHeight: '60px',
          }}
        >
          {!collapsed && (
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 200%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              Content Hub
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
              transition: 'color 200ms ease, background-color 200ms ease',
              flexShrink: 0,
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={16} strokeWidth={1.5} />
            ) : (
              <ChevronLeft size={16} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: collapsed ? '9px 0' : '9px 10px',
                  borderRadius: '8px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  transition: 'background-color 200ms ease, color 200ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      'var(--bg-tertiary)'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <Icon size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '12px 8px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '9px 0' : '9px 10px',
              borderRadius: '8px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '15px',
              width: '100%',
              transition: 'background-color 200ms ease, color 200ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-tertiary)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            }}
          >
            {isDark ? <Sun size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} /> : <Moon size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />}
            {!collapsed && (isDark ? 'Light mode' : 'Dark mode')}
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={collapsed ? 'Settings' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '9px 0' : '9px 10px',
              borderRadius: '8px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '15px',
              width: '100%',
              transition: 'background-color 200ms ease, color 200ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-tertiary)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            }}
          >
            <Settings size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            {!collapsed && 'Settings'}
          </button>

          {/* User row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '9px 0' : '9px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials || '?'}
            </div>

            {!collapsed && (
              <>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {email}
                </span>
                <form action={signOut}>
                  <button
                    type="submit"
                    title="Sign out"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 200ms ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                    }}
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </aside>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
