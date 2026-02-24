/**
 * Lấy 2 chữ cái viết tắt từ tên (dùng cho avatar fallback).
 * Đồng bộ giữa trang Thành viên, Tài khoản và Hồ sơ.
 */
export function getInitials(name: string): string {
  const s = (name || '').trim()
  if (!s) return '—'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[parts.length - 2][0] || ''
    const b = parts[parts.length - 1][0] || ''
    return (a + b).toUpperCase().slice(0, 2)
  }
  const two = s.slice(0, 2).toUpperCase()
  return two.length === 2 ? two : (two + two).slice(0, 2)
}
