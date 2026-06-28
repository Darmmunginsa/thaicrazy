import { Flag, Heart, Pin, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SITE_CONFIG } from '../config.js'
import { api } from '../services/api.js'
import { formatDate } from '../utils/format.js'
import { looksLikeSpam, sanitizeText } from '../utils/sanitize.js'

export function CommentSection({ postId }) {
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ displayName: '', comment: '', parentId: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.listComments(postId).then((data) => setComments(sortComments(data || [])))
  }, [postId])

  async function submit(event) {
    event.preventDefault()
    const last = Number(localStorage.getItem('ktln_last_comment') || 0)
    if (Date.now() - last < SITE_CONFIG.commentCooldownMs) {
      setMessage('กรุณารอสักครู่ก่อนส่งความคิดเห็นถัดไป')
      return
    }
    const displayName = sanitizeText(form.displayName)
    const comment = sanitizeText(form.comment)
    if (!displayName || !comment) {
      setMessage('กรุณากรอกชื่อและความคิดเห็น')
      return
    }
    if (looksLikeSpam(comment)) {
      setMessage('ความคิดเห็นนี้ดูเหมือนสแปม ระบบจึงยังไม่รับรายการ')
      return
    }
    const created = await api.createComment({ postId, displayName, comment, parentId: form.parentId })
    localStorage.setItem('ktln_last_comment', String(Date.now()))
    setComments((items) => sortComments([created, ...items]))
    setForm({ displayName: '', comment: '', parentId: '' })
    setMessage('ส่งความคิดเห็นแล้ว')
  }

  async function like(id) {
    await api.likeComment(id)
    setComments((items) => items.map((item) => (item.id === id ? { ...item, likes: Number(item.likes || 0) + 1 } : item)))
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ความคิดเห็น</h2>
        <span className="text-sm text-zinc-500">ใหม่สุดก่อน</span>
      </div>
      <form onSubmit={submit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {form.parentId && (
          <div className="mb-3 rounded-md bg-[#E53935]/10 px-3 py-2 text-sm text-[#E53935]">
            กำลังตอบกลับความคิดเห็น #{form.parentId}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            className="rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="Display Name"
            maxLength={80}
          />
          <textarea
            value={form.comment}
            onChange={(event) => setForm({ ...form, comment: event.target.value })}
            className="min-h-24 rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="เขียนความคิดเห็น"
            maxLength={1200}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{message}</p>
          <button className="inline-flex items-center gap-2 rounded-md bg-[#E53935] px-4 py-2 text-sm font-semibold text-white" type="submit">
            <Send size={16} />
            ส่ง
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {comments.map((item) => (
          <article key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{item.displayName}</strong>
              {item.pinned && <Pin size={14} className="text-[#E53935]" />}
              <span className="text-xs text-zinc-500">{formatDate(item.createdTime)}</span>
            </div>
            <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{item.comment}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => like(item.id)} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                <Heart size={14} /> {item.likes || 0}
              </button>
              <button onClick={() => setForm({ ...form, parentId: item.id })} className="rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                Reply
              </button>
              <button onClick={() => api.reportComment(item.id)} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                <Flag size={14} /> Report
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function sortComments(items) {
  return [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.createdTime) - new Date(a.createdTime))
}
