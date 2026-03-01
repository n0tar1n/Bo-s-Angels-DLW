const DAY_MS = 24 * 60 * 60 * 1000

export const toDate = (isoDate: string | null | undefined) => {
  if (!isoDate) return null
  const parsed = new Date(isoDate)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const daysBetween = (startIso: string, endIso: string) => {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS))
}

export const formatShortDate = (isoDate: string | null) => {
  if (!isoDate) return 'Never'
  const date = toDate(isoDate)
  if (!date) return 'Unknown'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const relativeDaysText = (isoDate: string | null, nowIso: string) => {
  if (!isoDate) return 'Not yet practiced'
  const delta = daysBetween(isoDate, nowIso)
  if (delta === 0) return 'Today'
  if (delta === 1) return '1 day ago'
  return `${delta} days ago`
}

export const daysAgo = (days: number, nowIso: string) => {
  const now = new Date(nowIso).getTime()
  return new Date(now - days * DAY_MS).toISOString()
}
