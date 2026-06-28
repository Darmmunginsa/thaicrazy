import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-[#E53935] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      aria-label="เปลี่ยนโหมดสี"
      title="เปลี่ยนโหมดสี"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
