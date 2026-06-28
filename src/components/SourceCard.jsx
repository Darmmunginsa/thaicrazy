import { ExternalLink } from 'lucide-react'

export function SourceCard({ url }) {
  const host = getHost(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm transition hover:border-[#E53935] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <div className="font-semibold text-zinc-950 dark:text-white">{host}</div>
        <div className="mt-1 line-clamp-1 text-xs text-zinc-500">{url}</div>
      </div>
      <ExternalLink size={18} className="min-w-5 text-[#E53935]" />
    </a>
  )
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
