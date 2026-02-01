/**
 * Ghi log thao tác (Dashboard) — gửi lên backend để hiển thị trong Lịch sử thao tác (Hồ sơ).
 */
import { apiUrl } from './api'

function getEmail(): string {
  if (typeof window === 'undefined') return ''
  try {
    const s = localStorage.getItem('userInfo')
    const u = s ? JSON.parse(s) : {}
    return (u.accountEmail || u.email || u.displayEmail || '').trim()
  } catch {
    return ''
  }
}

/**
 * Ghi log thao tác. Nếu có email từ response (vd. PATCH profile) thì truyền vào để đảm bảo khớp backend.
 */
export function logActivity(action: string, details?: string, email?: string): void {
  const logEmail = (email || '').trim() || getEmail()
  if (!logEmail) return
  fetch(apiUrl('/api/activity-log/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: logEmail, action, details: (details || '').trim() }),
  }).catch(() => {})
}
