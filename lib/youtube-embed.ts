/** Returns YouTube embed URL or null if not a recognized YouTube link. */
export function getYouTubeEmbedUrl(url: string): string | null {
  const raw = url?.trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/)
      if (embed) return `https://www.youtube.com/embed/${embed[1]}`
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }
  } catch {
    /* invalid URL */
  }
  return null
}

export function looksLikePdfUrl(url: string): boolean {
  const t = url?.trim().toLowerCase() || ''
  return t.includes('.pdf') || t.includes('application/pdf')
}
