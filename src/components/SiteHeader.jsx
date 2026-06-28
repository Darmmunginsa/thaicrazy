import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CATEGORIES, SITE_CONFIG } from '../config.js'
import { ThemeToggle } from './ThemeToggle.jsx'

const navItems = [
  ['/', 'Latest'],
  ['/?sort=trending', 'Trending'],
  ['/about', 'About'],
  ['/admin', 'Admin'],
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function submitSearch(event) {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="container-shell flex min-h-16 items-center gap-4">
        <Link to="/" className="min-w-fit">
          <div className="text-xl font-bold text-[#E53935]">{SITE_CONFIG.name}</div>
          <div className="hidden text-xs text-zinc-500 sm:block">{SITE_CONFIG.tagline}</div>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {navItems.map(([to, label]) => (
            <NavLink
              key={label}
              to={to}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="hidden w-full max-w-sm items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
          <Search size={18} className="text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent px-2 text-sm outline-none"
            placeholder="ค้นหาเรื่องที่สังคมเคยพูดถึง"
          />
        </form>

        <ThemeToggle />
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 lg:hidden dark:border-zinc-800"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="เปิดเมนู"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="container-shell space-y-4 py-4">
            <form onSubmit={submitSearch} className="flex items-center rounded-full border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <Search size={18} className="text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent px-2 text-sm outline-none"
                placeholder="ค้นหา"
              />
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(([to, label]) => (
                <Link key={label} to={to} onClick={() => setOpen(false)} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`/?category=${encodeURIComponent(category)}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-800"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
