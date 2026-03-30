'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendMagicLink(email: string) {
  const ownerEmail = process.env.OWNER_EMAIL

  // Silently reject non-owner emails — same response as success
  if (ownerEmail && email !== ownerEmail) {
    return { success: true }
  }

  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      shouldCreateUser: false, // no sign-up — only existing users
    },
  })

  if (error) {
    // Don't leak error details — log server-side only
    console.error('[auth] magic link error:', error.message)
    return { success: true } // same response regardless
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
