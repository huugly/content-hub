import { XMLParser } from 'fast-xml-parser'

export interface FetchedItem {
  external_id: string
  title: string
  description: string | null
  url: string
  thumbnail_url: string | null
  published_at: string | null
  platform: 'website'
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry', 'link'].includes(name),
  cdataPropName: '__cdata',
})

/**
 * Attempt to auto-discover RSS/Atom feed URL from a website's HTML.
 */
export async function discoverFeedUrl(siteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const html = await res.text()

    // Look for <link rel="alternate" type="application/rss+xml" ...>
    const feedMatches = [
      ...html.matchAll(
        /<link[^>]+rel=["']alternate["'][^>]+type=["'](application\/rss\+xml|application\/atom\+xml)["'][^>]*href=["']([^"']+)["'][^>]*>/gi
      ),
      ...html.matchAll(
        /<link[^>]+href=["']([^"']+)["'][^>]+type=["'](application\/rss\+xml|application\/atom\+xml)["'][^>]*>/gi
      ),
    ]

    for (const match of feedMatches) {
      const href = match[2] ?? match[1]
      if (href) {
        // Resolve relative URLs
        try {
          return new URL(href, siteUrl).toString()
        } catch {
          continue
        }
      }
    }

    // Common feed URL patterns as fallback
    const commonPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/feed/rss']
    const base = new URL(siteUrl).origin

    for (const path of commonPaths) {
      try {
        const feedRes = await fetch(`${base}${path}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (content-hub/1.0)' },
          signal: AbortSignal.timeout(5000),
        })
        if (feedRes.ok) {
          const contentType = feedRes.headers.get('content-type') ?? ''
          if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom')) {
            return `${base}${path}`
          }
        }
      } catch {
        continue
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fetch and parse RSS/Atom feed items from a website.
 */
export async function fetchWebsiteItems(feedUrl: string): Promise<FetchedItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status}`)
  }

  const xml = await res.text()
  const parsed = parser.parse(xml)

  // RSS 2.0
  if (parsed?.rss?.channel?.item) {
    const items = parsed.rss.channel.item as Record<string, unknown>[]
    return parseRssItems(items)
  }

  // Atom
  if (parsed?.feed?.entry) {
    const entries = parsed.feed.entry as Record<string, unknown>[]
    return parseAtomEntries(entries)
  }

  return []
}

function extractText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value.replace(/<[^>]+>/g, '').trim()
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const text = obj['#text'] ?? obj.__cdata ?? obj['_'] ?? ''
    return String(text).replace(/<[^>]+>/g, '').trim()
  }
  return String(value).replace(/<[^>]+>/g, '').trim()
}

function extractThumbnail(item: Record<string, unknown>): string | null {
  // media:thumbnail
  const mediaThumbnail = item['media:thumbnail']
  if (mediaThumbnail && typeof mediaThumbnail === 'object') {
    const url = (mediaThumbnail as Record<string, unknown>)['@_url']
    if (typeof url === 'string') return url
  }

  // enclosure with image type
  const enclosure = item['enclosure']
  if (enclosure && typeof enclosure === 'object') {
    const enc = enclosure as Record<string, unknown>
    const type = enc['@_type'] as string ?? ''
    if (type.startsWith('image/')) {
      return (enc['@_url'] as string) ?? null
    }
  }

  // media:content
  const mediaContent = item['media:content']
  if (mediaContent && typeof mediaContent === 'object') {
    const url = (mediaContent as Record<string, unknown>)['@_url']
    if (typeof url === 'string') return url
  }

  return null
}

function parseRssItems(items: Record<string, unknown>[]): FetchedItem[] {
  return items.map((item) => {
    const url = extractText(item.link) || extractText(item.guid) || ''
    const guid = extractText(item.guid) || url
    const description = extractText(item.description) || extractText(item['content:encoded']) || null

    return {
      external_id: guid,
      title: extractText(item.title) || 'Untitled',
      description: description ? description.slice(0, 300) : null,
      url,
      thumbnail_url: extractThumbnail(item),
      published_at: extractText(item.pubDate) || null,
      platform: 'website' as const,
    }
  }).filter((item) => item.url)
}

function parseAtomEntries(entries: Record<string, unknown>[]): FetchedItem[] {
  return entries.map((entry) => {
    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : []
    const altLink = (links as Record<string, unknown>[]).find(
      (l) => l['@_rel'] === 'alternate' || !l['@_rel']
    )
    const url = (altLink?.['@_href'] as string) ?? extractText(entry.id) ?? ''

    const description =
      extractText(entry.summary) || extractText(entry.content) || null

    return {
      external_id: extractText(entry.id) || url,
      title: extractText(entry.title) || 'Untitled',
      description: description ? description.slice(0, 300) : null,
      url,
      thumbnail_url: extractThumbnail(entry),
      published_at: extractText(entry.published) || extractText(entry.updated) || null,
      platform: 'website' as const,
    }
  }).filter((item) => item.url)
}
