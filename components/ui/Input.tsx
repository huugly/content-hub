import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400 }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[15px] text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[var(--text-tertiary)]',
          'focus:border-[var(--accent)]',
          className
        )}
        {...props}
      />
    </div>
  )
}
