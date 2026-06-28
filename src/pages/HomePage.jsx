import { Filter, Flame, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATEGORIES, SITE_CONFIG } from '../config.js'
import { PostCard } from '../components/PostCard.jsx'
import { usePosts } from '../hooks/usePosts.js'
import { splitList } from '../utils/format.js'
import { setPageMeta } from '../utils/seo.js'

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const { posts, loading, error } = usePosts()
  const activeCategory = params.get('category') || ''
  const sort = params.get('sort') || 'latest'
  const year = params.get('year') || ''

  useEffect(() => {
    setPageMeta({
      title: SITE_CONFIG.name,
      description: SITE_CONFIG.description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
      },
    })
  }, [])

  const filtered = useMemo(() => {
    const needle = (params.get('q') || '').toLowerCase()
    return posts
      .filter((post) => !activeCategory || post.category === activeCategory)
      .filter((post) => !year || String(new Date(post.publishDate).getFullYear()) === year)
      .filter((post) => {
        if (!needle) return true
        const haystack = [post.title, post.description, post.category, ...splitList(post.tags), new Date(post.publishDate).getFullYear()].join(' ').toLowerCase()
        return haystack.includes(needle)
      })
      .sort((a, b) => {
        if (sort === 'trending') return Number(b.views + b.likes) - Number(a.views + a.likes)
        if (sort === 'comments') return Number(b.commentsCount || 0) - Number(a.commentsCount || 0)
        if (sort === 'likes') return Number(b.likes || 0) - Number(a.likes || 0)
        return new Date(b.publishDate) - new Date(a.publishDate)
      })
  }, [posts, params, activeCategory, sort, year])

  function applySearch(event) {
    event.preventDefault()
    const next = new URLSearchParams(params)
    if (query.trim()) next.set('q', query.trim())
    else next.delete('q')
    setParams(next)
  }

  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <div className="container-shell py-8">
      <section className="grid gap-6 py-6 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="font-semibold text-[#E53935]">{SITE_CONFIG.tagline}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-zinc-950 sm:text-5xl dark:text-white">
            พื้นที่บันทึกประเด็นสาธารณะ ที่สังคมควรย้อนกลับมาตรวจสอบได้
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-600 dark:text-zinc-400">
            รวบรวมข่าว วิดีโอ ประกาศทางการ แถลงการณ์ และบทสนทนาที่เป็นข้อมูลสาธารณะ พร้อมลิงก์ต้นทางให้ผู้อ่านตรวจสอบด้วยตนเอง
          </p>
        </div>
        <div className="ad-slot text-xs">พื้นที่โฆษณาในอนาคต</div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={applySearch} className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <Search size={18} className="text-zinc-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Title, Description, Category, Tags, Year" />
          </label>
          <select value={activeCategory} onChange={(event) => updateParam('category', event.target.value)} className="rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-700">
            <option value="">ทุกหมวดหมู่</option>
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select value={sort} onChange={(event) => updateParam('sort', event.target.value)} className="rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-700">
            <option value="latest">Latest</option>
            <option value="trending">Trending by Views</option>
            <option value="comments">Trending by Comments</option>
            <option value="likes">Trending by Likes</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#E53935] px-4 py-2 font-semibold text-white" type="submit">
            <Filter size={18} /> ค้นหา
          </button>
        </form>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => updateParam('category', activeCategory === category ? '' : category)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              activeCategory === category
                ? 'border-[#E53935] bg-[#E53935] text-white'
                : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <Flame size={20} className="text-[#E53935]" />
        <h2 className="text-2xl font-bold">{sort === 'latest' ? 'Newest Posts' : 'Trending'}</h2>
      </div>
      {error && <p className="mt-4 text-sm text-[#E53935]">{error}</p>}
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} commentsCount={post.commentsCount || 0} />
          ))}
        </div>
      )}
    </div>
  )
}
