import { CalendarDays, MessageCircle, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { compactNumber, formatDate } from '../utils/format.js'
import { getYouTubeThumbnail } from '../utils/youtube.js'

export function PostCard({ post, commentsCount = 0 }) {
  const thumbnail = getYouTubeThumbnail(post.youtubeUrl)
  const mediaImage = post.coverImage || thumbnail || `${import.meta.env.BASE_URL}og-image.svg`

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link to={`/post/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
          <img
            src={mediaImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {thumbnail && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/75 px-3 py-1 text-xs text-white">
              <PlayCircle size={15} />
              YouTube
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-[#E53935]/10 px-2.5 py-1 font-medium text-[#E53935]">{post.category}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} />
            {formatDate(post.publishDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={14} />
            {compactNumber(commentsCount)} ความเห็น
          </span>
        </div>
        <Link to={`/post/${post.slug}`}>
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-zinc-950 group-hover:text-[#E53935] dark:text-white">
            {post.title}
          </h2>
        </Link>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{post.description}</p>
        {thumbnail && post.coverImage && <img src={thumbnail} alt="" loading="lazy" className="h-16 w-28 rounded-md object-cover" />}
      </div>
    </article>
  )
}
