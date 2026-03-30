'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Rss, LayoutGrid } from 'lucide-react'

const navItems = [
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/post-builder', label: 'Post Builder', icon: LayoutGrid },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 30,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '10px 0',
              textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color 200ms ease',
            }}
          >
            <Icon size={22} strokeWidth={1.5} />
            <span style={{ fontSize: '10px', lineHeight: 1 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
