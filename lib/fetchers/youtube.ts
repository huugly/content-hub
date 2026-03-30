import { XMLParser } from 'fast-xml-parser'

export interface FetchedItem {
  external_id: string
  title: string
  description: string | null
  url: string
  thumbnail_url: string | null
  published_at: string | null
  platform: 'youtube'
}

export interface ChannelInfo {
  channel_id: string
  name: string
  avatar_url: string | null
  feed_url: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['entry', 'link'].includes(name),
})

/**
 * Resolve a YouTube channel URL/handle to channel metadata by scraping
 * the channel page (avoids needing the YouTube Data API).
 */
export async function resolveYouTubeChannel(input: string): Promise<ChannelInfo> {
  // Build the canonical YouTube URL to fetch
  let pageUrl: string

  // youtube.com/channel/UCxxxx — direct channel ID
  const channelIdMatch = input.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (channelIdMatch) {
    const id = channelIdMatch[1]
    // We already have the channel ID, scrape to get the name
    pageUrl = `https://www.youtube.com/channel/${id}`
  } else {
    // youtube.com/@handle, @handle, youtube.com/c/name, youtube.com/user/name, or plain handle
    const handleMatch =
      input.match(/youtube\.com\/@([\w.-]+)/) ??
      input.match(/^@([\w.-]+)/) ??
      input.match(/youtube\.com\/(?:c|user)\/([\w.-]+)/)
    const handle = handleMatch ? handleMatch[1] : input.replace(/^@/, '').trim()

    if (!handle) throw new Error('Could not parse YouTube channel URL')

    // Normalise: if input looks like a full URL already, use it; otherwise build @handle URL
    if (input.startsWith('http')) {
      // Strip query/hash and use as-is
      pageUrl = input.split('?')[0].split('#')[0]
    } else {
      pageUrl = `https://www.youtube.com/@${handle}`
    }
  }

  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  if (!res.ok) throw new Error(`Failed to fetch YouTube page: ${res.status}`)

  const html = await res.text()

  // Extract channel ID
  const idMatch = html.match(/"externalId":"(UC[\w-]{10,})"/) ??
    html.match(/channel_id=(UC[\w-]{10,})/)
  if (!idMatch) throw new Error('YouTube channel not found')
  const channelId = idMatch[1]

  // Extract channel name — look for the canonical title in ytInitialData
  let name = ''
  const titleMatch = html.match(/"title":\{"simpleText":"([^"]{2,80})"\}[\s\S]{0,200}"channelId"/) ??
    html.match(/"channelId":"UC[\w-]+"[\s\S]{0,500}"title":\{"simpleText":"([^"]{2,80})"\}/) ??
    html.match(/<meta name="title" content="([^"]+)"/) ??
    html.match(/<title>([^<]+)<\/title>/)
  if (titleMatch) name = titleMatch[1].replace(/ - YouTube$/, '').trim()
  if (!name) name = channelId

  // Extract avatar URL
  let avatarUrl: string | null = null
  const avatarMatch = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/)
  if (avatarMatch) avatarUrl = avatarMatch[1]

  return {
    channel_id: channelId,
    name,
    avatar_url: avatarUrl,
    feed_url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  }
}

/**
 * Fetch recent videos from a YouTube channel's RSS feed.
 */
export async function fetchYouTubeItems(feedUrl: string): Promise<FetchedItem[]> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (content-hub/1.0)' },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch YouTube feed: ${res.status}`)
  }

  const xml = await res.text()
  const parsed = parser.parse(xml)

  const entries = parsed?.feed?.entry ?? []
  const items: FetchedItem[] = []

  for (const entry of entries) {
    try {
      // Extract video ID
      const videoId: string =
        entry['yt:videoId'] ??
        entry.id?.replace('yt:video:', '') ??
        ''

      if (!videoId) continue

      const title: string = entry.title?.['#text'] ?? entry.title ?? ''
      const url: string = Array.isArray(entry.link)
        ? entry.link.find((l: { '@_rel'?: string }) => l['@_rel'] === 'alternate')?.['@_href'] ?? `https://youtube.com/watch?v=${videoId}`
        : `https://youtube.com/watch?v=${videoId}`

      const description: string | null =
        entry['media:group']?.['media:description'] ??
        entry.summary ??
        null

      const published: string | null = entry.published ?? null

      items.push({
        external_id: videoId,
        title: String(title).trim(),
        description: description ? String(description).slice(0, 300) : null,
        url,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        published_at: published,
        platform: 'youtube',
      })
    } catch {
      // Skip malformed entries
    }
  }

  return items
}
