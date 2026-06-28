import { useParams } from 'react-router-dom'
import { PostCard } from '../components/PostCard.jsx'
import { usePosts } from '../hooks/usePosts.js'

export default function TimelinePage() {
  const { timeline } = useParams()
  const { posts, loading } = usePosts()
  const name = decodeURIComponent(timeline)
  const items = posts
    .filter((post) => post.timeline === name)
    .sort((a, b) => String(a.timelineYear).localeCompare(String(b.timelineYear)) || new Date(a.publishDate) - new Date(b.publishDate))

  return (
    <div className="container-shell py-10">
      <p className="font-semibold text-[#E53935]">Timeline</p>
      <h1 className="mt-2 text-4xl font-black">{name}</h1>
      {loading ? <p className="mt-6">กำลังโหลด...</p> : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
