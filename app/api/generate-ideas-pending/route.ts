import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, AuthError } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const admin = getAdminClient()

    // Find all content items with no ideas generated yet
    const { data: pendingItems, error } = await admin
      .from('content_items')
      .select('id')
      .is('ideas_generated_at', null)
      .limit(50) // Process in batches of 50

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pendingItems || pendingItems.length === 0) {
      return NextResponse.json({ message: 'No pending items', processed: 0 })
    }

    const itemIds = pendingItems.map((item: { id: string }) => item.id)

    // Call generate-ideas route
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${appUrl}/api/generate-ideas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ item_ids: itemIds }),
    })

    const result = await res.json()

    return NextResponse.json({
      pending_found: pendingItems.length,
      ...result,
    })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[generate-ideas-pending] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
