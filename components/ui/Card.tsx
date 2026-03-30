import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export function Card({ className, children, padding = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px]',
        padding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
