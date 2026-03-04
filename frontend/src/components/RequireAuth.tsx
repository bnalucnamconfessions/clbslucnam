import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { USER_ALLOWED_PATHS, USER_RESTRICTED_PREFIXES } from '@/lib/permissions'
import { logActivity } from '@/lib/activityLog'

const AUTH_KEY = 'adminToken'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem(AUTH_KEY, token)
      const fn = params.get('fullName')
      const role = params.get('role')
      const clubPermission = params.get('clubPermission') || 'user'
      const email = params.get('email')
      let picture = params.get('picture')
      if (!picture && typeof document !== 'undefined') {
        const match = document.cookie.match(/auth_picture=([^;]+)/)
        picture = match ? decodeURIComponent(match[1]) : ''
      }
      if (fn) localStorage.setItem('adminName', fn)
      if (role) localStorage.setItem('adminRole', role)
      if (picture) localStorage.setItem('adminAvatar', picture)
      const accountIdParam = params.get('accountId')
      const accountId = accountIdParam ? parseInt(accountIdParam, 10) : null
      const userInfo: Record<string, unknown> = { fullName: fn || 'User', email: email || '', accountEmail: email || '', role: role || 'Người dùng', clubPermission, avatar: picture || '' }
      if (!Number.isNaN(accountId) && accountId != null) userInfo.accountId = accountId
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      window.dispatchEvent(new Event('userInfoUpdated'))
      const isGoogle = typeof token === 'string' && token.startsWith('google-')
      if (isGoogle && (email || '').trim()) logActivity('Đăng nhập', `Đăng nhập qua Google | Email: ${(email || '').trim() || '—'}`, (email || '').trim() || undefined)
      document.cookie = 'auth_picture=; path=/; max-age=0'
      window.history.replaceState({}, '', window.location.pathname)
      if (clubPermission === 'user') {
        const path = pathname || ''
        const allowed = USER_ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '/'))
        const restricted = path === '/dashboard' || USER_RESTRICTED_PREFIXES.some((p) => path.startsWith(p))
        if (restricted || (!allowed && path.startsWith('/dashboard'))) {
          navigate('/dashboard/xep-hang', { replace: true })
        }
      }
      return
    }
    if (!localStorage.getItem(AUTH_KEY)) {
      navigate('/dang-nhap', { replace: true })
      return
    }
    const userInfoRaw = localStorage.getItem('userInfo')
    let clubPermission = 'user'
    if (userInfoRaw) {
      try {
        const parsed = JSON.parse(userInfoRaw)
        clubPermission = parsed.clubPermission || 'user'
      } catch {
        /* ignore */
      }
    }
    if (clubPermission === 'user') {
      const path = pathname || ''
      const isAllowed = USER_ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '/'))
      const isRestricted = path === '/dashboard' || USER_RESTRICTED_PREFIXES.some((p) => path.startsWith(p))
      const willRedirect = isRestricted || (!isAllowed && path.startsWith('/dashboard'))
      if (willRedirect) {
        navigate('/dashboard/xep-hang', { replace: true })
      }
    }
  }, [navigate, pathname])

  return <>{children}</>
}
