import { CalendarDays, Eye, Tag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CommentSection } from '../components/CommentSection.jsx'
import { PostCard } from '../components/PostCard.jsx'
import { SourceCard } from '../components/SourceCard.jsx'
import { api } from '../services/api.js'
import { usePosts } from '../hooks/usePosts.js'
import { compactNumber, formatDate, splitList } from '../utils/format.js'
import { setPageMeta } from '../utils/seo.js'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtube.js'

export default function PostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const { posts } = usePosts()

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .getPost(slug)
      .then((data) => {
        if (!alive) return
        setPost(data)
        if (data) {
          const previewImage = data.coverImage || getYouTubeThumbnail(data.youtubeUrl) || `${import.meta.env.BASE_URL}og-image.svg`
          setPageMeta({
            title: data.metaTitle || data.title,
            description: data.metaDescription || data.description,
            image: previewImage,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: data.title,
              description: data.description,
              image: previewImage,
              datePublished: data.publishDate,
            },
          })
        }
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  const tags = splitList(post?.tags)
  const related = useMemo(
    () => posts.filter((item) => item.id !== post?.id && splitList(item.tags).some((tag) => tags.includes(tag))).slice(0, 3),
    [posts, post, tags],
  )

  if (loading) return <div className="container-shell py-16">กำลังโหลด...</div>
  if (!post) return <div className="container-shell py-16">ไม่พบโพสต์</div>

  const embedUrl = getYouTubeEmbedUrl(post.youtubeUrl)
  const previewImage = post.coverImage || getYouTubeThumbnail(post.youtubeUrl) || `${import.meta.env.BASE_URL}og-image.svg`

  return (
    <article className="container-shell py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-[#E53935]/10 px-3 py-1 font-medium text-[#E53935]">{post.category}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={16} />{formatDate(post.publishDate)}</span>
            <span className="inline-flex items-center gap-1"><Eye size={16} />{compactNumber(post.views || 0)} views</span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-8 text-zinc-700 dark:text-zinc-300">{post.description}</p>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            เว็บไซต์นี้รวบรวมข้อมูลสาธารณะและลิงก์ต้นทาง ไม่ใช่สำนักข่าว โปรดตรวจสอบวันที่เผยแพร่และแหล่งอ้างอิงเดิมก่อนสรุปข้อเท็จจริง
          </div>

          <img src={previewImage} alt="" className="mt-6 aspect-[16/9] w-full rounded-lg object-cover shadow-sm" />

          {embedUrl && (
            <section className="mt-8">
              <h2 className="mb-3 text-2xl font-bold">YouTube</h2>
              <iframe
                className="aspect-video w-full rounded-lg"
                src={embedUrl}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-bold">External Sources</h2>
            <div className="grid gap-3">
              {splitList(post.sourceUrls).map((url) => <SourceCard key={url} url={url} />)}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-bold">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} to={`/?q=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-700">
                  <Tag size={14} /> {tag}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-bold">Timeline</h2>
            <Link to={`/timeline/${encodeURIComponent(post.timeline)}`} className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#E53935] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm text-zinc-500">{post.timelineYear}</div>
              <div className="text-xl font-bold">{post.timeline}</div>
              <p className="mt-1 text-sm text-zinc-500">ดูเหตุการณ์ทั้งหมดในไทม์ไลน์นี้</p>
            </Link>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-bold">Related Posts</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {related.map((item) => <PostCard key={item.id} post={item} />)}
            </div>
          </section>

          <div className="mt-8">
            <CommentSection postId={post.id} />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="ad-slot text-xs">AdSense 300x250</div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-bold">ความรับผิดชอบ</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              ผู้ดูแลเป็นผู้เผยแพร่โพสต์และดูแลความคิดเห็น ผู้เยี่ยมชมสามารถอ่าน เปิดลิงก์ต้นทาง แสดงความคิดเห็น ตอบกลับ และกดถูกใจได้เท่านั้น
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
