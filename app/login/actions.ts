'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithPassword(email: string, password: string) {
  const ownerEmail = process.env.OWNER_EMAIL
  if (ownerEmail && email !== ownerEmail) {
    return { error: 'Invalid credentials' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  redirect('/watchlist')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
