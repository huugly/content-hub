'use client'

import { useState } from 'react'
import { sendMagicLink } from './actions'

export default function LoginPage() {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL_HINT ?? ''
  const [email, setEmail] = useState(ownerEmail)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    await sendMagicLink(email.trim())
    setSent(true)
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '32px 28px',
        }}
      >
        {/* Logo / wordmark */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent)',
              marginBottom: '12px',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.3px',
              color: 'var(--text-primary)',
            }}
          >
            Content Hub
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            huugly
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 200ms ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%',
                backgroundColor: loading || !email.trim() ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: loading || !email.trim() ? 'var(--text-secondary)' : 'white',
                border: 'none',
                borderRadius: '980px',
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 200ms ease',
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 199, 89, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Check your email
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
              }}
            >
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </div>
            <button
              onClick={() => setSent(false)}
              style={{
                marginTop: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
