import { XMLParser } from 'fast-xml-parser'

export interface FetchedItem {
  external_id: string
  title: string
  description: string | null
  url: string
  thumbnail_url: null
  published_at: string | null
  platform: 'x'
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry'].includes(name),
})

/**
 * Build the RSSHub feed URL for an X (Twitter) profile.
 */
export function buildXFeedUrl(profileUrl: string): string {
  const baseUrl = (process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app').replace(/\/$/, '')

  // Extract username from various URL formats
  const match =
    profileUrl.match(/(?:x\.com|twitter\.com)\/(@?[\w]+)/) ??
    profileUrl.match(/^@?([\w]+)$/)

  if (!match) throw new Error('Could not parse X profile URL')

  const username = match[1].replace('@', '')
  return `${baseUrl}/twitter/user/${username}`
}

/**
 * Extract post ID from a Twitter/X URL.
 */
function extractPostId(url: string): string {
  const match = url.match(/status(?:es)?\/(\d+)/)
  return match ? match[1] : url
}

/**
 * Fetch recent posts from an X profile via RSSHub.
 */
export async function fetchXItems(feedUrl: string): Promise<FetchedItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (content-hub/1.0)',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch X RSS feed: ${res.status}`)
  }

  const xml = await res.text()
  const parsed = parser.parse(xml)

  // Support both RSS 2.0 and Atom formats
  const items: unknown[] = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? []
  const results: FetchedItem[] = []

  for (const item of items as Record<string, unknown>[]) {
    try {
      const url: string =
        (item.link as string) ??
        (item.id as string) ??
        ''

      const title: string =
        (item.title as string)?.replace(/<[^>]+>/g, '').trim() ?? ''

      const description: string | null =
        (item.description as string)?.replace(/<[^>]+>/g, '').trim() ??
        (item['content:encoded'] as string)?.replace(/<[^>]+>/g, '').trim() ??
        null

      const published: string | null =
        (item.pubDate as string) ??
        (item.published as string) ??
        (item.updated as string) ??
        null

      const external_id = extractPostId(url)

      results.push({
        external_id,
        title: title || description?.slice(0, 100) || 'X post',
        description: description ? description.slice(0, 300) : null,
        url,
        thumbnail_url: null,
        published_at: published,
        platform: 'x',
      })
    } catch {
      // Skip malformed items
    }
  }

  return results
}
