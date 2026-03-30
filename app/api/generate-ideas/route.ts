import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth, getAdminClient, AuthError } from '@/lib/auth-helpers'

const anthropic = new Anthropic()

interface ContentItemForSummary {
  id: string
  title: string
  description: string | null
  platform: string
}

interface SummaryResult {
  item_id: string
  summary: string
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const { item_ids } = body as { item_ids: string[] }

    if (!item_ids || item_ids.length === 0) {
      return NextResponse.json({ error: 'item_ids required' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: items, error } = await admin
      .from('content_items')
      .select('id, title, description, platform')
      .in('id', item_ids)

    if (error || !items || items.length === 0) {
      return NextResponse.json({ error: 'No items found' }, { status: 404 })
    }

    const itemsForPrompt = items.map((item: ContentItemForSummary) => ({
      id: item.id,
      platform: item.platform,
      title: item.title,
      description: item.description ?? '',
    }))

    const systemPrompt = `For each piece of content, write exactly one short sentence (max 20 words) summarising what the content is actually about — the core topic or message. Be specific and factual.

Return ONLY valid JSON, no markdown:
[{ "item_id": "uuid", "summary": "One sentence here." }]`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: JSON.stringify(itemsForPrompt) }],
      system: systemPrompt,
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let results: SummaryResult[] = []
    try {
      const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      results = JSON.parse(clean)
    } catch {
      console.error('[generate-ideas] Failed to parse response:', responseText)
      return NextResponse.json({ error: 'Failed to parse summary response' }, { status: 500 })
    }

    const now = new Date().toISOString()
    let updated = 0

    for (const result of results) {
      if (!result.item_id || !result.summary) continue
      const { error: updateError } = await admin
        .from('content_items')
        .update({
          content_ideas: [result.summary],
          ideas_generated_at: now,
        })
        .eq('id', result.item_id)
      if (!updateError) updated++
    }

    return NextResponse.json({ processed: items.length, updated, timestamp: now })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[generate-ideas] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
