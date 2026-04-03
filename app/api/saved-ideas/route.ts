import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getAdminClient, getSessionUserId, AuthError } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('saved_ideas')
      .select('*, content_items(title, url, platform, published_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()

    let targetUserId = userId ?? (await getSessionUserId(request))
    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const body = await request.json()
    const { content_item_id, idea_text, title, source_url, source_creator, platform_target } =
      body as {
        content_item_id?: string
        idea_text: string
        title: string
        source_url?: string
        source_creator?: string
        platform_target?: string
      }

    if (!idea_text || !title) {
      return NextResponse.json({ error: 'idea_text and title required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('saved_ideas')
      .insert({
        user_id: targetUserId,
        content_item_id: content_item_id ?? null,
        title,
        idea_text,
        source_url: source_url ?? null,
        source_creator: source_creator ?? null,
        platform_target: platform_target ?? 'other',
        status: 'backlog',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()

    let targetUserId = userId ?? (await getSessionUserId(request))
    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (typeof body.status === 'string') updates.status = body.status
    if (body.platform_target !== undefined) {
      updates.platform_target = Array.isArray(body.platform_target)
        ? JSON.stringify(body.platform_target)
        : body.platform_target
    }

    const { data, error } = await admin
      .from('saved_ideas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', targetUserId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request)
    const admin = getAdminClient()

    let targetUserId = userId ?? (await getSessionUserId(request))
    if (!targetUserId) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { error } = await admin
      .from('saved_ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', targetUserId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
