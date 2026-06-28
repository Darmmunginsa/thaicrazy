import { Link2, Lightbulb, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CATEGORIES, SITE_CONFIG } from '../config.js'
import { api } from '../services/api.js'
import { sanitizeText } from '../utils/sanitize.js'
import { setPageMeta } from '../utils/seo.js'

const emptyForm = {
  displayName: '',
  contact: '',
  title: '',
  summary: '',
  sourceUrls: '',
  category: 'สังคม',
  tags: '',
  reason: '',
}

export default function SuggestPage() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setPageMeta({
      title: `เสนอเรื่อง | ${SITE_CONFIG.name}`,
      description: 'ส่งประเด็นหรือแหล่งข้อมูลสาธารณะให้ผู้ดูแลพิจารณาบรรจุในคลังความทรงจำสาธารณะ',
    })
  }, [])

  async function submit(event) {
    event.preventDefault()
    setStatus('')

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, sanitizeText(value)]),
    )

    if (!payload.title || !payload.summary || !payload.sourceUrls) {
      setStatus('กรุณากรอกชื่อเรื่อง สรุปประเด็น และลิงก์อ้างอิงอย่างน้อย 1 ลิงก์')
      return
    }

    setSubmitting(true)
    try {
      await api.createSuggestion(payload)
      setForm(emptyForm)
      setStatus('ส่งเรื่องให้ผู้ดูแลแล้ว ขอบคุณที่ช่วยกันบันทึกความทรงจำสาธารณะ')
    } catch (error) {
      setStatus(error.message || 'ส่งเรื่องไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="container-shell py-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="font-semibold text-[#E53935]">Suggest to Admin</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight">
            เสนอเรื่องที่ควรถูกบันทึกไว้ ให้ผู้ดูแลพิจารณา
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-zinc-600 dark:text-zinc-400">
            ช่องทางนี้ไม่ได้สร้างโพสต์โดยตรง แต่เป็นการส่งหัวข้อ แหล่งอ้างอิง และบริบทให้ผู้ดูแลตรวจสอบก่อนเผยแพร่
          </p>
        </div>
        <aside className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#E53935]/10 text-[#E53935]">
            <Lightbulb size={22} />
          </div>
          <h2 className="mt-4 font-bold">ควรส่งอะไรบ้าง</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            ส่งเรื่องที่มีแหล่งข้อมูลสาธารณะตรวจสอบได้ เช่น ข่าวเดิม วิดีโอ ประกาศทางการ แถลงการณ์ หรือบทสนทนาสาธารณะที่ควรเก็บเป็นไทม์ไลน์
          </p>
        </aside>
      </section>

      <form onSubmit={submit} className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ชื่อผู้เสนอ" value={form.displayName} onChange={(value) => update('displayName', value)} placeholder="ไม่บังคับ" />
          <Field label="ช่องทางติดต่อ" value={form.contact} onChange={(value) => update('contact', value)} placeholder="อีเมล, Facebook, X หรือเว้นว่างได้" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
          <Field label="ชื่อเรื่อง" value={form.title} onChange={(value) => update('title', value)} required />
          <label>
            <span className="text-sm font-medium">หมวดหมู่</span>
            <select
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            >
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">สรุปประเด็น</span>
          <textarea
            value={form.summary}
            onChange={(event) => update('summary', event.target.value)}
            className="mt-1 min-h-32 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="เล่าว่าเรื่องนี้คืออะไร เกิดขึ้นช่วงไหน และทำไมควรถูกจดจำ"
            maxLength={1800}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="inline-flex items-center gap-2 text-sm font-medium"><Link2 size={16} /> ลิงก์อ้างอิงสาธารณะ</span>
          <textarea
            value={form.sourceUrls}
            onChange={(event) => update('sourceUrls', event.target.value)}
            className="mt-1 min-h-24 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
            placeholder="ใส่ BBC, Reuters, The Standard, ไทยรัฐ, Facebook, TikTok, X, YouTube หรือ URL อื่น ๆ คั่นด้วยบรรทัดใหม่หรือ comma"
            required
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Tags" value={form.tags} onChange={(value) => update('tags', value)} placeholder="tag1, tag2" />
          <Field label="เหตุผลที่ควรบรรจุ" value={form.reason} onChange={(value) => update('reason', value)} placeholder="เช่น เป็นประเด็นซ้ำ, มีผลกระทบสาธารณะ" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{status}</p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-[#E53935] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? 'กำลังส่ง...' : 'ส่งให้ผู้ดูแล'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = '', required = false }) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-[#E53935] dark:border-zinc-700"
      />
    </label>
  )
}
