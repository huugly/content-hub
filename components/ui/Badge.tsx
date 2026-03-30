import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'platform' | 'status' | 'count'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  platform?: string
  className?: string
}

export function Badge({ children, variant = 'platform', platform, className }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-[980px] px-[10px] py-[3px] text-[12px] font-normal leading-tight'

  const platformColors: Record<string, string> = {
    youtube: 'bg-[rgba(255,0,0,0.08)] text-[#cc0000] dark:bg-[rgba(255,80,80,0.12)] dark:text-[#ff6b6b]',
    x: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    website: 'bg-[rgba(99,102,241,0.08)] text-[#4f46e5] dark:bg-[rgba(99,102,241,0.15)] dark:text-[#818cf8]',
    linkedin: 'bg-[rgba(10,102,194,0.08)] text-[#0A66C2] dark:bg-[rgba(10,102,194,0.15)] dark:text-[#60a5fa]',
    instagram: 'bg-[rgba(225,48,108,0.08)] text-[#E1306C] dark:text-[#f472b6]',
    newsletter: 'bg-[rgba(249,115,22,0.08)] text-[#ea580c] dark:text-[#fb923c]',
    other: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  }

  const statusColors: Record<string, string> = {
    backlog: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    in_progress: 'bg-[rgba(255,149,0,0.10)] text-[var(--warning)]',
    done: 'bg-[rgba(52,199,89,0.10)] text-[var(--success)]',
  }

  if (variant === 'platform' && platform) {
    return (
      <span className={cn(base, platformColors[platform] ?? platformColors.other, className)}>
        {children}
      </span>
    )
  }

  if (variant === 'status') {
    const key = String(children).toLowerCase().replace(' ', '_')
    return (
      <span className={cn(base, statusColors[key] ?? statusColors.backlog, className)}>
        {children}
      </span>
    )
  }

  // count variant
  return (
    <span
      className={cn(
        base,
        'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-[7px] py-[1px] text-[11px] min-w-[18px] text-center',
        className
      )}
    >
      {children}
    </span>
  )
}
