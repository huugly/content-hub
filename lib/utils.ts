import { formatDistanceToNow, format, isAfter, subDays } from 'date-fns'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function timeAgo(date: string | Date | null): string {
  if (!date) return ''
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

export function isWithinDays(date: string | Date | null, days: number): boolean {
  if (!date) return false
  try {
    return isAfter(new Date(date), subDays(new Date(), days))
  } catch {
    return false
  }
}

export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    x: 'X',
    website: 'Website',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    newsletter: 'Newsletter',
    other: 'Other',
  }
  return labels[platform] ?? platform
}

export function extractInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    youtube: '#FF0000',
    x: '#000000',
    website: '#6366f1',
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    newsletter: '#F97316',
    other: '#6e6e73',
  }
  return colors[platform] ?? '#6e6e73'
}
