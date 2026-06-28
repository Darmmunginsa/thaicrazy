import { LogIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SITE_CONFIG } from '../config.js'
import { useAuth } from '../context/AuthContext.jsx'

export function GoogleLoginButton({ compact = false }) {
  const { loginWithGoogleProfile } = useAuth()
  const buttonRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!SITE_CONFIG.googleClientId) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: SITE_CONFIG.googleClientId,
          callback: async (response) => {
            try {
              const profile = parseJwt(response.credential)
              await loginWithGoogleProfile({
                googleId: profile.sub,
                displayName: profile.name,
                email: profile.email,
                photoUrl: profile.picture,
                credential: response.credential,
              })
            } catch (err) {
              setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
            }
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: compact ? 'medium' : 'large',
          text: 'signin_with',
          shape: 'pill',
        })
      })
      .catch(() => setError('โหลด Google Login ไม่สำเร็จ'))

    return () => {
      cancelled = true
    }
  }, [compact, loginWithGoogleProfile])

  if (!SITE_CONFIG.googleClientId) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        ยังไม่ได้ตั้งค่า Google Client ID
      </div>
    )
  }

  return (
    <div>
      <div ref={buttonRef} />
      {error && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-[#E53935]">
          <LogIn size={14} />
          {error}
        </div>
      )}
    </div>
  )
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function parseJwt(token) {
  const payload = token.split('.')[1]
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(decodeURIComponent(escape(window.atob(normalized))))
}
