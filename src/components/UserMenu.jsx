import { LogOut, ShieldCheck } from 'lucide-react'
import { GoogleLoginButton } from './GoogleLoginButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) return <GoogleLoginButton compact />

  return (
    <div className="flex items-center gap-2">
      <img src={user.photoUrl || `${import.meta.env.BASE_URL}og-image.svg`} alt="" className="h-9 w-9 rounded-full object-cover" />
      <div className="hidden leading-tight xl:block">
        <div className="max-w-32 truncate text-sm font-semibold">{user.displayName}</div>
        <div className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <ShieldCheck size={12} />
          {user.role}
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 text-zinc-600 hover:text-[#E53935] dark:border-zinc-800 dark:text-zinc-300"
        title="ออกจากระบบ"
        aria-label="ออกจากระบบ"
      >
        <LogOut size={17} />
      </button>
    </div>
  )
}
