/**
 * Cấu hình API backend - dùng chung cho toàn bộ frontend.
 * Đặt VITE_API_URL trong .env (ví dụ: http://localhost:8000).
 */
const base =
  typeof window !== 'undefined'
    ? (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    : (import.meta.env?.VITE_API_URL as string) || 'http://localhost:8000'

export const API_BASE_URL = base
/** @deprecated use API_BASE_URL */
export const API_BASE = base

export function apiUrl(path: string): string {
  const baseUrl = String(API_BASE_URL).replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${p}`
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
