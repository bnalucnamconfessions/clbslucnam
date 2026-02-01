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
