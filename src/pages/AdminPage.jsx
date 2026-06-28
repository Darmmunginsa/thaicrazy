import { Edit3, EyeOff, Inbox, LayoutDashboard, LogIn, MessageSquare, Save, Settings, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, POST_STATUSES, SITE_CONFIG } from '../config.js'
import { api } from '../services/api.js'
import { slugify } from '../utils/seo.js'

const emptyPost = {
  title: '',
  description: '',
  coverImage: '',
  youtubeUrl: '',
  sourceUrls: '',
  category: 'การเมือง',
  tags: '',
  publishDate: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  timeline: '',
  timelineYear: String(new Date().getFullYear()),
}

export default function AdminPage() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem(SITE_CONFIG.adminSessionKey) || 'null'))
  const [password, setPassword] = useState('')
  const [post, setPost] = useState(emptyPost)
  const [message, setMessage] = useState('')

  async function login(event) {
    event.preventDefault()
    const result = await api.adminLogin(password)
    localStorage.setItem(SITE_CONFIG.adminSessionKey, JSON.stringify(result))
    setSession(result)
  }

  async function savePost(event) {
    event.preventDefault()
    const payload = {
      ...post,
      slug: slugify(post.title),
      metaTitle: post.title,
      metaDescription: post.description.slice(0, 155),
    }
    await api.createPost(payload, session.token)
    setMessage('บันทึกโพสต์แล้ว')
    setPost(emptyPost)
  }

  if (!session) {
    return (
      <div className="container-shell grid min-h-[70vh] place-items-center py-12">
        <form onSubmit={login} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E53935]/10 text-[#E53935]"><LogIn /></div>
          <h1 className="mt-4 text-2xl font-black">Administrator Login</h1>
          <p className="mt-2 text-sm text-zinc-500">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้าง แก้ไข ลบโพสต์ และจัดการความคิดเห็น</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-5 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="Admin password"
          />
          <button className="mt-4 w-full rounded-md bg-[#E53935] px-4 py-2 font-semibold text-white" type="submit">เข้าสู่ระบบ</button>
        </form>
      </div>
    )
  }

  return (
    <div className="container-shell py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[#E53935]">Admin Panel</p>
          <h1 className="text-3xl font-black">Dashboard</h1>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(SITE_CONFIG.adminSessionKey)
            setSession(null)
          }}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Logout
        </button>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <AdminStat icon={<LayoutDashboard />} label="Posts" value="CRUD via Apps Script" />
        <AdminStat icon={<MessageSquare />} label="Comments" value="Delete / Hide / Pin" />
        <AdminStat icon={<Inbox />} label="Suggestions" value="Review submitted topics" />
        <AdminStat icon={<Tags />} label="Categories & Tags" value="Google Sheet rows" />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={savePost} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center gap-2">
            <Edit3 size={20} className="text-[#E53935]" />
            <h2 className="text-xl font-bold">Create Post</h2>
          </div>
          <div className="grid gap-4">
            <Field label="Title" value={post.title} onChange={(value) => setPost({ ...post, title: value })} required />
            <label>
              <span className="text-sm font-medium">Description</span>
              <textarea value={post.description} onChange={(event) => setPost({ ...post, description: event.target.value })} className="mt-1 min-h-28 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700" required />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cover Image URL" value={post.coverImage} onChange={(value) => setPost({ ...post, coverImage: value })} />
              <Field label="Youtube URL" value={post.youtubeUrl} onChange={(value) => setPost({ ...post, youtubeUrl: value })} />
            </div>
            <Field label="External Source URL" value={post.sourceUrls} onChange={(value) => setPost({ ...post, sourceUrls: value })} placeholder="คั่นหลายลิงก์ด้วย comma" />
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-sm font-medium">Category</span>
                <select value={post.category} onChange={(event) => setPost({ ...post, category: event.target.value })} className="mt-1 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-700">
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <Field label="Tags" value={post.tags} onChange={(value) => setPost({ ...post, tags: value })} placeholder="tag1, tag2" />
              <Field label="Publish Date" type="date" value={post.publishDate} onChange={(value) => setPost({ ...post, publishDate: value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-sm font-medium">Status</span>
                <select value={post.status} onChange={(event) => setPost({ ...post, status: event.target.value })} className="mt-1 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-700">
                  {POST_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <Field label="Timeline" value={post.timeline} onChange={(value) => setPost({ ...post, timeline: value })} />
              <Field label="Timeline Year" value={post.timelineYear} onChange={(value) => setPost({ ...post, timelineYear: value })} />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-zinc-500">{message}</p>
            <button className="inline-flex items-center gap-2 rounded-md bg-[#E53935] px-4 py-2 font-semibold text-white" type="submit"><Save size={18} /> Save</button>
          </div>
        </form>

        <aside className="space-y-4">
          <AdminBox icon={<MessageSquare />} title="Manage Comments" text="ใช้ Apps Script actions: moderateComment, deleteComment, hideComment, pinComment" />
          <AdminBox icon={<Inbox />} title="Topic Suggestions" text="รายการจากผู้ชมจะเข้า Sheet Suggestions สถานะ new เพื่อให้แอดมินตรวจสอบแหล่งอ้างอิงก่อนสร้างโพสต์จริง" />
          <AdminBox icon={<Trash2 />} title="Delete Post" text="ลบโพสต์ผ่าน deletePost โดยส่ง token ผู้ดูแลทุกครั้ง" />
          <AdminBox icon={<EyeOff />} title="Hidden Status" text="โพสต์สถานะ Hidden จะไม่ถูกส่งกลับใน listPosts สาธารณะ" />
          <AdminBox icon={<Settings />} title="Site Settings" text="รองรับ settings ผ่าน Google Sheet สำหรับ SEO, Ads และข้อมูลเว็บไซต์ในอนาคต" />
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
      />
    </label>
  )
}

function AdminStat({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[#E53935]">{icon}</div>
      <div className="mt-3 font-bold">{label}</div>
      <div className="text-sm text-zinc-500">{value}</div>
    </div>
  )
}

function AdminBox({ icon, title, text }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[#E53935]">{icon}</div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  )
}
