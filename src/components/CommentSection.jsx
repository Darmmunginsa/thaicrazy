import { Edit3, Flag, Heart, Pin, Send, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SITE_CONFIG } from '../config.js'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import { formatDate } from '../utils/format.js'
import { looksLikeSpam, sanitizeText } from '../utils/sanitize.js'
import { GoogleLoginButton } from './GoogleLoginButton.jsx'

export function CommentSection({ postId }) {
  const { user, isLoggedIn, canComment } = useAuth()
  const [comments, setComments] = useState([])
  const [likedComments, setLikedComments] = useState(() => new Set())
  const [form, setForm] = useState({ comment: '', parentId: '' })
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.listComments(postId).then((data) => setComments(sortComments(data || [])))
  }, [postId])

  async function submit(event) {
    event.preventDefault()
    if (!user) {
      setMessage('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น')
      return
    }
    if (!canComment) {
      setMessage('บัญชีของคุณถูกจำกัดสิทธิ์ในการแสดงความคิดเห็น')
      return
    }

    const last = Number(localStorage.getItem('ktln_last_comment') || 0)
    if (Date.now() - last < SITE_CONFIG.commentCooldownMs) {
      setMessage('กรุณารอสักครู่ก่อนส่งความคิดเห็นถัดไป')
      return
    }

    const comment = sanitizeText(form.comment)
    if (!comment) {
      setMessage('กรุณาเขียนความคิดเห็น')
      return
    }
    if (comment.length > 1000) {
      setMessage('ความคิดเห็นต้องไม่เกิน 1,000 ตัวอักษร')
      return
    }
    if (looksLikeSpam(comment)) {
      setMessage('ความคิดเห็นนี้ดูเหมือนสแปม ระบบจึงยังไม่รับรายการ')
      return
    }

    if (editing) {
      const id = editing.commentId || editing.id
      await api.updateComment(id, user.userId, comment)
      setComments((items) =>
        sortComments(items.map((item) => ((item.commentId || item.id) === id ? { ...item, comment, updatedAt: new Date().toISOString() } : item))),
      )
      setEditing(null)
      setMessage('แก้ไขความคิดเห็นแล้ว')
    } else {
      const created = await api.createComment({
        postId,
        userId: user.userId,
        parentCommentId: form.parentId,
        comment,
      })
      setComments((items) => sortComments([normalizeComment(created), ...items]))
      setMessage('ส่งความคิดเห็นแล้ว')
    }

    localStorage.setItem('ktln_last_comment', String(Date.now()))
    setForm({ comment: '', parentId: '' })
  }

  async function like(id) {
    if (!canComment || !user) {
      setMessage('กรุณาเข้าสู่ระบบก่อนกดถูกใจ')
      return
    }
    if (likedComments.has(id)) {
      setMessage('คุณกดถูกใจความคิดเห็นนี้แล้ว')
      return
    }
    await api.likeComment(id, user.userId)
    setLikedComments((current) => new Set([...current, id]))
    setComments((items) =>
      items.map((item) => ((item.commentId || item.id) === id ? { ...item, likeCount: Number(item.likeCount || item.likes || 0) + 1 } : item)),
    )
  }

  async function report(id) {
    if (!canComment || !user) {
      setMessage('กรุณาเข้าสู่ระบบก่อนรายงานความคิดเห็น')
      return
    }
    await api.reportComment(id, user.userId)
    setMessage('รายงานความคิดเห็นแล้ว')
  }

  async function deleteOwn(id) {
    await api.deleteOwnComment(id, user.userId)
    setComments((items) => items.filter((item) => (item.commentId || item.id) !== id))
  }

  function replyTo(item) {
    setEditing(null)
    setForm({ comment: '', parentId: item.commentId || item.id })
  }

  function edit(item) {
    setEditing(item)
    setForm({ comment: item.comment, parentId: item.parentCommentId || '' })
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ความคิดเห็น</h2>
        <span className="text-sm text-zinc-500">ใหม่สุดก่อน</span>
      </div>

      {!isLoggedIn && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 font-semibold">กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น</p>
          <GoogleLoginButton />
        </div>
      )}

      {isLoggedIn && !canComment && (
        <div className="rounded-lg border border-[#E53935]/30 bg-[#E53935]/10 p-5 font-semibold text-[#E53935]">
          บัญชีของคุณถูกจำกัดสิทธิ์ในการแสดงความคิดเห็น
        </div>
      )}

      {isLoggedIn && canComment && (
        <form onSubmit={submit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {form.parentId && (
            <div className="mb-3 rounded-md bg-[#E53935]/10 px-3 py-2 text-sm text-[#E53935]">
              กำลังตอบกลับความคิดเห็น #{form.parentId}
            </div>
          )}
          {editing && (
            <div className="mb-3 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              กำลังแก้ไขความคิดเห็นของคุณ
            </div>
          )}

          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <img src={user.photoUrl || `${import.meta.env.BASE_URL}og-image.svg`} alt="" className="h-8 w-8 rounded-full object-cover" />
            แสดงความคิดเห็นในชื่อ <strong>{user.displayName}</strong>
          </div>

          <textarea
            value={form.comment}
            onChange={(event) => setForm({ ...form, comment: event.target.value })}
            className="min-h-24 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="เขียนความคิดเห็น"
            maxLength={1000}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">{message}</p>
            <button className="inline-flex items-center gap-2 rounded-md bg-[#E53935] px-4 py-2 text-sm font-semibold text-white" type="submit">
              <Send size={16} />
              {editing ? 'บันทึก' : 'ส่ง'}
            </button>
          </div>
        </form>
      )}

      {message && (!isLoggedIn || !canComment) && <p className="text-sm text-zinc-500">{message}</p>}

      <div className="space-y-3">
        {comments.map((raw) => {
          const item = normalizeComment(raw)
          const id = item.commentId || item.id
          const ownComment = user?.userId && item.userId === user.userId

          return (
            <article key={id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center gap-2">
                {item.photoUrl && <img src={item.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />}
                <strong>{item.displayName}</strong>
                {item.pinned && <Pin size={14} className="text-[#E53935]" />}
                <span className="text-xs text-zinc-500">{formatDate(item.createdAt || item.createdTime)}</span>
              </div>
              <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{item.comment}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => like(id)}
                  disabled={likedComments.has(id)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs disabled:opacity-60 dark:border-zinc-700"
                >
                  <Heart size={14} /> {item.likeCount || 0}
                </button>
                <button onClick={() => replyTo(item)} className="rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                  Reply
                </button>
                <button onClick={() => report(id)} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                  <Flag size={14} /> Report
                </button>
                {ownComment && (
                  <>
                    <button onClick={() => edit(item)} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700">
                      <Edit3 size={14} /> แก้ไข
                    </button>
                    <button onClick={() => deleteOwn(id)} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs text-[#E53935] dark:border-zinc-700">
                      <Trash2 size={14} /> ลบ
                    </button>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function normalizeComment(item) {
  return {
    ...item,
    id: item.id || item.commentId,
    commentId: item.commentId || item.id,
    userId: item.userId || item.UserID,
    parentCommentId: item.parentCommentId || item.parentId || '',
    createdAt: item.createdAt || item.createdTime,
    likeCount: Number(item.likeCount ?? item.likes ?? 0),
    pinned: item.pinned === true || item.pinned === 'TRUE',
  }
}

function sortComments(items) {
  return [...items]
    .map(normalizeComment)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.createdAt || b.createdTime) - new Date(a.createdAt || a.createdTime))
}
