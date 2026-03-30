import React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none border-0 outline-none'

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[980px]',
    secondary:
      'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-strong)] rounded-[980px]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-[8px]',
    destructive:
      'bg-transparent text-[var(--destructive)] hover:bg-[rgba(255,59,48,0.08)] rounded-[8px]',
  }

  const sizes: Record<ButtonSize, string> = {
    default: 'px-5 py-[10px] text-[15px]',
    sm: 'px-3 py-[6px] text-[13px]',
    icon: 'p-2 w-8 h-8',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}
