/**
 * Cấu hình API backend - dùng chung cho toàn bộ frontend.
 * Đặt NEXT_PUBLIC_API_URL trong .env.local (ví dụ: http://localhost:8000).
 */
export const API_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function apiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Auth cho API cần kiểm tra quyền (Kho sách, Thành viên). Trả headers + accountEmail. */
export function getApiAuth(): { headers: Record<string, string>; accountEmail: string } {
  if (typeof window === 'undefined') return { headers: {}, accountEmail: '' }
  const token = localStorage.getItem('adminToken')
  let accountEmail = ''
  try {
    const s = localStorage.getItem('userInfo')
    const u = s ? JSON.parse(s) : {}
    accountEmail = (u.accountEmail || u.email || '').trim()
  } catch {
    /* ignore */
  }
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers, accountEmail }
}

/** URL có thêm accountEmail cho GET/DELETE (backend kiểm tra quyền). */
export function apiUrlWithAuth(path: string): string {
  const { accountEmail } = getApiAuth()
  const base = apiUrl(path)
  if (!accountEmail) return base
  const sep = path.includes('?') ? '&' : '?'
  return `${base}${sep}accountEmail=${encodeURIComponent(accountEmail)}`
}
