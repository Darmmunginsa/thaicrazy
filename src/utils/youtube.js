export function getYouTubeId(url = '') {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1)
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v')
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/)
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/)
    return embedMatch?.[1] || shortsMatch?.[1] || ''
  } catch {
    return ''
  }
}

export function getYouTubeEmbedUrl(url = '') {
  const id = getYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

export function getYouTubeThumbnail(url = '') {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}
