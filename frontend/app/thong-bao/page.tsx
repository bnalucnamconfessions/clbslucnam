'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Sidebar from '../components/Sidebar'
import RequireAuth from '../components/RequireAuth'
import DatePickerButton from '../components/DatePickerButton'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'
import { useRefetchOnFocusAndInterval } from '../../lib/refetch'
import { getVisibleChannelIds, canPostNotifications, getSenderLabel, getAllowedAudienceOptions } from '../../lib/permissions'

const READ_IDS_KEY = 'thongBaoReadIds'

type Notification = {
  id: number
  title: string
  summary: string
  audience: string
  scheduledDate: string
  status: 'sent' | 'scheduled' | 'draft'
  type: 'internal' | 'public'
  urgency?: 'urgent' | 'important' | 'normal'
  senderLabel?: string
  /** Danh sách đã đọc: { name, email } để hiển thị tên + tài khoản */
  readBy?: { name: string; email: string }[]
  /** Danh sách chưa đọc: { name, email } */
  unreadBy?: { name: string; email: string }[]
}
type NotificationStatus = Notification['status']
type NotificationType = Notification['type']

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '').trim()
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

function formatTimeAgo(scheduledStr: string): string {
  if (!scheduledStr) return ''
  const match = scheduledStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2})/)
  if (!match) return scheduledStr
  const [, d, m, y, h, min] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min))
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
  return scheduledStr
}

function getNotificationIcon(title: string): { icon: string; bg: string; text: string } {
  const t = title.toLowerCase()
  if (t.includes('khẩn') || t.includes('kiểm kê')) return { icon: 'warning', bg: 'bg-red-100', text: 'text-red-600' }
  if (t.includes('phân công') || t.includes('assignment')) return { icon: 'assignment_ind', bg: 'bg-blue-100', text: 'text-blue-600' }
  if (t.includes('workshop') || t.includes('sự kiện') || t.includes('event')) return { icon: 'event', bg: 'bg-blue-100', text: 'text-blue-600' }
  if (t.includes('xác nhận') || t.includes('mượn') || t.includes('phê duyệt')) return { icon: 'settings_suggest', bg: 'bg-green-100', text: 'text-green-600' }
  if (t.includes('nhắc nhở') || t.includes('hạn trả')) return { icon: 'alarm', bg: 'bg-orange-100', text: 'text-orange-600' }
  if (t.includes('biên bản') || t.includes('họp')) return { icon: 'description', bg: 'bg-gray-100', text: 'text-gray-600' }
  if (t.includes('nội quy') || t.includes('cập nhật')) return { icon: 'campaign', bg: 'bg-blue-100', text: 'text-blue-600' }
  if (t.includes('sinh nhật') || t.includes('chúc mừng')) return { icon: 'celebration', bg: 'bg-blue-100', text: 'text-blue-600' }
  return { icon: 'campaign', bg: 'bg-blue-100', text: 'text-blue-600' }
}

/** Nhãn hiển thị thay cho "Người gửi" theo ngữ cảnh thông báo. */
function getSenderLabelForNotification(title: string): string {
  const t = (title || '').toLowerCase()
  if (t.includes('trả sách') || t.includes('ghi chú trả')) return 'Người ghi trả sách'
  return 'Người gửi'
}

/** Lấy tên người mượn từ summary — dòng "Người mượn: ..." hoặc "Thành viên trả sách: ..." (legacy). */
function getBorrowerNameFromSummary(summary: string): string | null {
  if (!summary?.trim()) return null
  const m = summary.match(/(?:Người mượn|Thành viên trả sách|Người trả):\s*([^\n]+)/)
  return m ? m[1].trim() : null
}

/** Lấy tên người ghi mượn sách (người ghi phiếu mượn) từ summary — dòng "Người ghi mượn sách: ...". */
function getBorrowRecorderNameFromSummary(summary: string): string | null {
  if (!summary?.trim()) return null
  const m = summary.match(/Người ghi mượn sách:\s*([^\n]+)/)
  return m ? m[1].trim() : null
}

/** Mức độ thông báo (suy từ tiêu đề nếu backend chưa có trường). */
type UrgencyLevel = 'urgent' | 'important' | 'normal'
const URGENCY_STYLES: Record<UrgencyLevel, { label: string; border: string; badge: string }> = {
  urgent: { label: 'Khẩn', border: 'border-l-red-500', badge: 'text-[10px] uppercase font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full' },
  important: { label: 'Quan trọng', border: 'border-l-[#137fec]', badge: 'text-[10px] uppercase font-bold text-[#137fec] bg-[#137fec]/10 px-2 py-0.5 rounded-full' },
  normal: { label: 'Thường', border: 'border-slate-200', badge: 'text-[10px] uppercase font-medium text-slate-500 bg-gray-100 px-2 py-0.5 rounded-full' },
}
function getUrgency(title: string): { level: UrgencyLevel; label: string; border: string; badge: string } {
  const t = title.toLowerCase()
  if (t.includes('khẩn') || t.includes('đột xuất')) return { level: 'urgent', ...URGENCY_STYLES.urgent }
  if (t.includes('nhắc nhở') || t.includes('hạn hoàn thành') || t.includes('phân công') || t.includes('quan trọng') || t.includes('hạn')) return { level: 'important', ...URGENCY_STYLES.important }
  return { level: 'normal', ...URGENCY_STYLES.normal }
}
function getUrgencyFromLevel(level: UrgencyLevel): { level: UrgencyLevel; label: string; border: string; badge: string } {
  const s = URGENCY_STYLES[level] ?? URGENCY_STYLES.normal
  return { level, ...s }
}

/** Chỉ các kênh theo ban — không có "Tất cả kênh" (mỗi thông báo thuộc một đối tượng cụ thể). */
const NOTIFICATION_CHANNELS: { id: string; label: string; audienceFilter: string | null; icon: string }[] = [
  { id: 'book', label: 'Ban Quản lý Sách', audienceFilter: 'Ban Quản lý Sách', icon: 'menu_book' },
  { id: 'communication', label: 'Ban Truyền thông - Đối Ngoại', audienceFilter: 'Ban Truyền thông - Đối Ngoại', icon: 'campaign' },
  { id: 'hr', label: 'Ban Nhân sự - Tài chính', audienceFilter: 'Ban Nhân sự - Tài Chính', icon: 'groups' },
  { id: 'exec', label: 'Ban Chủ nhiệm', audienceFilter: 'Ban chủ nhiệm', icon: 'stars' },
  { id: 'user', label: 'Thông báo dành cho tôi', audienceFilter: 'Người dùng', icon: 'person' },
]

function getReadIds(): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_IDS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    const nums = (Array.isArray(arr) ? arr : []).map((x: unknown) => Number(x)).filter((n: number) => !Number.isNaN(n))
    return new Set(nums)
  } catch {
    return new Set()
  }
}

function setReadIds(ids: Set<number>) {
  if (typeof window === 'undefined') return
  try {
    const arr = Array.from(ids).map((id) => Number(id)).filter((n) => !Number.isNaN(n))
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr))
  } catch {
    // ignore quota / private mode
  }
}

export default function ThongBaoPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNotif, setEditingNotif] = useState<Notification | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formNotif, setFormNotif] = useState({
    title: '',
    summary: '',
    audience: '',
    type: 'internal' as 'internal' | 'public',
    urgency: 'normal' as UrgencyLevel,
    scheduledDate: '',
    scheduledTime: '',
  })
  const createEditorRef = useRef<HTMLDivElement>(null)
  const editEditorRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<Range | null>(null)

  // View "Thông báo của tôi" (người dùng) — theo code.html/screen.png
  const [viewMode, setViewMode] = useState<'mine' | 'manage'>('mine')
  const [readIds, setReadIdsState] = useState<Set<number>>(getReadIds)
  const [userSearch, setUserSearch] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('book')
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | ''>('')
  const [detailModal, setDetailModal] = useState<Notification | null>(null)
  const [listModal, setListModal] = useState<{ title: string; items: { name: string; email: string }[] } | null>(null)
  const [userCanManage, setUserCanManage] = useState(false)
  const [currentUserPermission, setCurrentUserPermission] = useState<string>('user')

  useLayoutEffect(() => {
    setReadIdsState(getReadIds())
    const syncReadIds = () => setReadIdsState(getReadIds())
    window.addEventListener('storage', syncReadIds)
    const syncPermission = () => {
      try {
        const raw = localStorage.getItem('userInfo')
        if (raw) {
          const parsed = JSON.parse(raw)
          const perm = (parsed.clubPermission || 'user').toLowerCase()
          setUserCanManage(perm !== 'user')
          setCurrentUserPermission(perm)
        }
      } catch {}
    }
    syncPermission()
    window.addEventListener('userInfoUpdated', syncPermission)
    return () => {
      window.removeEventListener('storage', syncReadIds)
      window.removeEventListener('userInfoUpdated', syncPermission)
    }
  }, [])

  const visibleChannelIds = getVisibleChannelIds(currentUserPermission)
  const visibleChannels = NOTIFICATION_CHANNELS.filter(ch => visibleChannelIds.includes(ch.id))
  const userCanPost = canPostNotifications(currentUserPermission)
  const allowedAudienceOptions = getAllowedAudienceOptions(currentUserPermission)
  /** Thành viên ban / user: chỉ 1 kênh → ẩn tab, sidebar, header kênh. */
  const isSingleChannelView = visibleChannels.length <= 1

  useEffect(() => {
    if (visibleChannelIds.length > 0 && !visibleChannelIds.includes(selectedChannel)) {
      setSelectedChannel(visibleChannelIds[0])
    }
  }, [currentUserPermission])

  useEffect(() => {
    if (!userCanPost && viewMode === 'manage') setViewMode('mine')
  }, [userCanPost, viewMode])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth('/api/notifications'), { headers })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(typeof errBody?.detail === 'string' ? errBody.detail : 'Lỗi tải danh sách thông báo')
      }
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Cập nhật khi quay lại tab hoặc mỗi 45 giây
  useRefetchOnFocusAndInterval(fetchNotifications, { intervalMs: 20 * 1000 })

  useEffect(() => {
    if (showCreateForm && createEditorRef.current) {
      createEditorRef.current.innerHTML = formNotif.summary || ''
    }
  }, [showCreateForm])

  useEffect(() => {
    if (showEditModal && editEditorRef.current) {
      editEditorRef.current.innerHTML = formNotif.summary || ''
    }
  }, [showEditModal, formNotif.summary])

  const saveSelection = (editorRef: React.RefObject<HTMLDivElement | null>) => {
    const sel = window.getSelection()
    const el = editorRef.current
    if (sel && sel.rangeCount > 0 && el && el.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
    } else {
      savedSelectionRef.current = null
    }
  }

  const restoreSelection = (editorRef: React.RefObject<HTMLDivElement | null>) => {
    const range = savedSelectionRef.current
    if (!range || !editorRef.current) return
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
    savedSelectionRef.current = null
  }

  const execEditorCommand = (editorRef: React.RefObject<HTMLDivElement | null>, cmd: string, value?: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    restoreSelection(editorRef)
    document.execCommand(cmd, false, value ?? undefined)
  }

  const handleCreateNotification = async (status: 'draft' | 'sent') => {
    if (status === 'sent' && !formNotif.title.trim()) {
      alert('Vui lòng nhập tiêu đề thông báo trước khi gửi')
      return
    }
    const summaryHtml = createEditorRef.current?.innerHTML ?? formNotif.summary
    setSubmitting(true)
    setError(null)
    try {
      let scheduledDate: string | null = null
      if (formNotif.scheduledDate && formNotif.scheduledTime) {
        scheduledDate = `${formNotif.scheduledDate}T${formNotif.scheduledTime}:00`
      } else if (formNotif.scheduledDate) {
        scheduledDate = `${formNotif.scheduledDate}T00:00:00`
      }
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl('/api/notifications/create'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formNotif.title,
          summary: summaryHtml,
          audience: formNotif.audience,
          type: formNotif.type,
          urgency: formNotif.urgency || 'normal',
          status,
          scheduledDate,
          senderLabel: getSenderLabel(currentUserPermission),
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi tạo thông báo')
      }
      setShowCreateForm(false)
      setFormNotif({ title: '', summary: '', audience: '', type: 'internal', urgency: 'normal', scheduledDate: '', scheduledTime: '' })
      if (createEditorRef.current) createEditorRef.current.innerHTML = ''
      logActivity('Tạo thông báo', `Tiêu đề: ${formNotif.title} | Đối tượng: ${formNotif.audience || '—'} | Loại: ${formNotif.type === 'public' ? 'Công khai' : 'Nội bộ'} | Mức độ: ${formNotif.urgency === 'urgent' ? 'Khẩn' : formNotif.urgency === 'important' ? 'Quan trọng' : 'Thường'}`)
      fetchNotifications()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const parseScheduledForForm = (scheduledStr: string) => {
    if (!scheduledStr) return { date: '', time: '' }
    const match = scheduledStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2})/)
    if (match) {
      const [, d, m, y, h, min] = match
      return { date: `${y}-${m}-${d}`, time: `${h}:${min}` }
    }
    return { date: '', time: '' }
  }

  const handleDeleteNotification = async (notif: Notification) => {
    if (!confirm(`Bạn có chắc muốn xóa thông báo "${notif.title}"?`)) return
    setError(null)
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/notifications/${notif.id}/delete`), { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi xóa thông báo')
      }
      logActivity('Xóa thông báo', `Tiêu đề: ${notif.title} | Đối tượng: ${notif.audience || '—'}`)
      fetchNotifications()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    }
  }

  const handleOpenEdit = (notif: Notification) => {
    const { date, time } = parseScheduledForForm(notif.scheduledDate)
    const allowed = getAllowedAudienceOptions(currentUserPermission)
    const audience = allowed.some(o => o.value === notif.audience) ? notif.audience : (allowed[0]?.value ?? '')
    setEditingNotif(notif)
    setFormNotif({
      title: notif.title,
      summary: notif.summary,
      audience,
      type: notif.type,
      urgency: (notif.urgency && ['urgent', 'important', 'normal'].includes(notif.urgency) ? notif.urgency : 'normal') as UrgencyLevel,
      scheduledDate: date,
      scheduledTime: time,
    })
    setShowEditModal(true)
  }

  const handleUpdateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNotif) return
    setSubmitting(true)
    setError(null)
    try {
      let scheduledDate: string | null = null
      if (formNotif.scheduledDate && formNotif.scheduledTime) {
        scheduledDate = `${formNotif.scheduledDate}T${formNotif.scheduledTime}:00`
      } else if (formNotif.scheduledDate) {
        scheduledDate = `${formNotif.scheduledDate}T00:00:00`
      }
      const summaryHtml = editEditorRef.current?.innerHTML ?? formNotif.summary
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl(`/api/notifications/${editingNotif.id}`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formNotif.title,
          summary: summaryHtml,
          audience: formNotif.audience,
          type: formNotif.type,
          urgency: formNotif.urgency || 'normal',
          scheduledDate,
          senderLabel: getSenderLabel(currentUserPermission),
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi cập nhật thông báo')
      }
      setShowEditModal(false)
      setEditingNotif(null)
      setFormNotif({ title: '', summary: '', audience: '', type: 'internal', urgency: 'normal', scheduledDate: '', scheduledTime: '' })
      logActivity('Sửa thông báo', `Tiêu đề: ${formNotif.title} | Đối tượng: ${formNotif.audience || '—'} | Loại: ${formNotif.type === 'public' ? 'Công khai' : 'Nội bộ'}`)
      fetchNotifications()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCount = notifications.length
  const sentCount = notifications.filter(n => n.status === 'sent').length
  const scheduledCount = notifications.filter(n => n.status === 'scheduled').length
  const draftCount = notifications.filter(n => n.status === 'draft').length

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || notification.status === statusFilter
    const matchesType = !typeFilter || notification.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusLabel = (status: NotificationStatus) => {
    const labels = {
      sent: { text: 'Đã gửi', color: 'text-green-700', bg: 'bg-green-500' },
      scheduled: { text: 'Lên lịch', color: 'text-orange-700', bg: 'bg-orange-500' },
      draft: { text: 'Nháp', color: 'text-gray-700', bg: 'bg-gray-400' }
    }
    return labels[status]
  }

  const getTypeLabel = (type: NotificationType) => {
    return type === 'internal' 
      ? { text: 'Nội bộ', color: 'bg-blue-50 text-blue-700 border-blue-100' }
      : { text: 'Công khai', color: 'bg-purple-50 text-purple-700 border-purple-100' }
  }

  const userSentList = notifications.filter(n => n.status === 'sent')
  const channelConfig = NOTIFICATION_CHANNELS.find(c => c.id === selectedChannel)
  const audienceFilter = channelConfig?.audienceFilter ?? null
  /** Giá trị audience = thông báo chung (gửi tất cả), luôn hiện ở mọi kênh. */
  const GENERAL_AUDIENCE_VALUES = ['tat ca', 'tất cả', 'tất cả thành viên', 'chung']
  const isGeneralAudience = (aud: string) => {
    const a = (aud || '').trim().toLowerCase()
    return !a || GENERAL_AUDIENCE_VALUES.some(v => a.includes(v))
  }
  const userFilteredByChannel = !audienceFilter
    ? userSentList
    : userSentList.filter(n => {
        const aud = (n.audience || '').trim()
        const audLower = aud.toLowerCase()
        const filterLower = audienceFilter.toLowerCase()
        // Kênh "Người dùng": chỉ hiện thông báo gửi đến Người dùng, không hiện "Tất cả thành viên"
        if (filterLower === 'người dùng') {
          return audLower.includes('người dùng') && !GENERAL_AUDIENCE_VALUES.some(v => audLower.includes(v))
        }
        if (isGeneralAudience(aud)) return true
        return audLower.includes(filterLower)
      })
  /** Một danh sách duy nhất: tất cả thông báo, chưa đọc xếp trước. */
  const userFilteredByRead = [...userFilteredByChannel].sort((a, b) => {
    const aUnread = !readIds.has(Number(a.id)) ? 1 : 0
    const bUnread = !readIds.has(Number(b.id)) ? 1 : 0
    return bUnread - aUnread
  })
  const userFilteredBySearch = userSearch.trim()
    ? userFilteredByRead.filter(n =>
        n.title.toLowerCase().includes(userSearch.toLowerCase()) ||
        stripHtml(n.summary).toLowerCase().includes(userSearch.toLowerCase())
      )
    : userFilteredByRead
  const userFilteredByUrgency = !urgencyFilter
    ? userFilteredBySearch
    : userFilteredBySearch.filter(n => getUrgency(n.title).level === urgencyFilter)

  const markAsRead = (id: number) => {
    const numId = Number(id)
    if (Number.isNaN(numId)) return
    const next = new Set(readIds)
    next.add(numId)
    setReadIdsState(next)
    setReadIds(next) // persist to localStorage
    // Đồng bộ lên backend (để quản lý thông báo hiển thị cột đã đọc)
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null
      if (raw) {
        const parsed = JSON.parse(raw)
        const email = (parsed.accountEmail || parsed.email || '').trim()
        if (email) {
          const { headers } = getApiAuth()
          fetch(apiUrl(`/api/notifications/${numId}/read`), {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
            .then(() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('notificationsUnreadCountChanged')) })
            .catch(() => {})
        }
      }
    } catch {}
  }

  const isNewNotification = (n: Notification): boolean => {
    const match = (n.scheduledDate || '').match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2})/)
    if (!match) return false
    const [, d, m, y, h, min] = match
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min))
    const diffMs = Date.now() - date.getTime()
    return diffMs < 24 * 60 * 60 * 1000
  }

  const content = (
    <RequireAuth>
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          {/* Header trang: đồng bộ với Tổng quan / Bảng xếp hạng (px-4 md:px-6 lg:px-8 pt-6 pb-6) */}
          <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Thông báo
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                {isSingleChannelView
                  ? 'Xem thông báo dành cho bạn. Lọc theo mức độ hoặc tìm kiếm.'
                  : 'Xem thông báo từ các kênh bạn được xem. Chọn kênh bên trái, lọc theo mức độ hoặc tìm kiếm trong ban.'}
              </p>
            </div>
          </header>
          <div className="p-4 md:p-6 lg:px-8 lg:py-8 w-full">
            {/* Tabs: ẩn khi chỉ 1 kênh và không có quyền đăng (chỉ một tab) */}
            {(!isSingleChannelView || userCanPost) && (
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
              <button
                onClick={() => setViewMode('mine')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'mine' ? 'bg-[#137fec] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Thông báo của tôi
              </button>
              {userCanPost && (
                <button
                  onClick={() => setViewMode('manage')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'manage' ? 'bg-[#137fec] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Quản lý thông báo
                </button>
              )}
            </div>
            )}

            {/* View: Thông báo nội bộ (theo code.html / screen.png) */}
            {viewMode === 'mine' && (
              <>
              <div className="flex gap-6 lg:gap-8 w-full max-w-[1400px] mx-auto">
                {/* Sidebar Chọn kênh: chỉ hiện khi có từ 2 kênh trở lên (ẩn cho Người dùng / thành viên 1 kênh) */}
                {!isSingleChannelView && (
                <aside className="w-full md:w-72 flex-shrink-0 hidden md:block">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sticky top-24">
                    <h3 className="text-sm font-bold text-slate-700 mb-1 px-2">Chọn kênh</h3>
                    <p className="text-xs text-slate-500 mb-4 px-2">Chọn một ban để xem thông báo liên quan.</p>
                    <div className="space-y-1">
                      {visibleChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChannel(ch.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left text-sm font-medium ${
                            selectedChannel === ch.id
                              ? 'bg-[#137fec]/10 border-[#137fec] text-[#137fec] font-bold'
                              : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{ch.icon}</span>
                          <span>{ch.label}</span>
                        </button>
                      ))}
                    </div>
                    {userCanPost && (
                      <div className="mt-8 px-2">
                        <div className="bg-blue-50 rounded-xl p-4 border border-[#137fec]/20">
                          <p className="text-sm font-bold text-slate-800 mb-1">Quản lý thông báo</p>
                          <p className="text-xs text-slate-600 mb-3">Bạn có quyền tạo và chỉnh sửa thông báo. Chuyển sang tab Quản lý thông báo để soạn mới.</p>
                          <button
                            type="button"
                            onClick={() => setViewMode('manage')}
                            className="w-full py-2.5 bg-[#137fec] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#0f6fd6] transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Tạo thông báo mới
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
                )}

                {/* Nội dung chính */}
                  <div className="flex-1 flex flex-col min-w-0">
                  {/* Mobile: chọn kênh — chỉ hiện khi có từ 2 kênh trở lên */}
                  {!isSingleChannelView && (
                  <div className="md:hidden mb-4">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Chọn kênh</label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium"
                    >
                      {visibleChannels.map((ch) => (
                        <option key={ch.id} value={ch.id}>{ch.label}</option>
                      ))}
                    </select>
                  </div>
                  )}
                  {/* Header phần thông báo: ẩn khi chỉ 1 kênh (tránh lặp "Ban Chủ nhiệm" / mô tả) */}
                  {!isSingleChannelView && (
                  <div className="mb-6">
                    <h1 className="text-slate-900 text-2xl font-extrabold leading-tight tracking-tight">
                      {channelConfig?.label ?? 'Ban Quản lý Sách'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      Thông báo gửi tới ban này và thông báo chung. Chưa đọc hiển thị trước.
                    </p>
                  </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        placeholder={isSingleChannelView ? 'Tìm kiếm thông báo...' : 'Tìm kiếm trong ban...'}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] transition-all"
                      />
                      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">search</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter((e.target.value || '') as UrgencyLevel | '')}
                        className="h-10 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:ring-[#137fec] focus:border-[#137fec] px-3 flex-1 sm:flex-none min-w-[120px]"
                      >
                        <option value="">Tất cả mức độ</option>
                        <option value="urgent">Khẩn</option>
                        <option value="important">Quan trọng</option>
                        <option value="normal">Thường</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <span className="material-symbols-outlined animate-spin text-3xl text-[#137fec]">progress_activity</span>
                      </div>
                    ) : (
                      userFilteredByUrgency.map((n) => {
                        const meta = getNotificationIcon(n.title)
                        const urgency = (n.urgency && ['urgent', 'important', 'normal'].includes(n.urgency))
                          ? getUrgencyFromLevel(n.urgency)
                          : getUrgency(n.title)
                        const timeLabel = formatTimeAgo(n.scheduledDate)
                        const sender = n.audience || 'Ban Quản lý Sách'
                        const isUrgentCard = urgency.level === 'urgent'
                        const isRead = readIds.has(Number(n.id))
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              setDetailModal(n)
                              markAsRead(n.id)
                            }}
                            className={`group cursor-pointer rounded-2xl shadow-sm hover:shadow-md transition-all border p-4 flex gap-4 border-l-4 ${urgency.border} ${
                              isUrgentCard ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-200'
                            } ${isRead ? 'opacity-90' : ''}`}
                          >
                            <div className={`flex-shrink-0 size-10 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center`}>
                              <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-slate-900 font-bold text-base truncate">{n.title}</h3>
                                <span className={`shrink-0 whitespace-nowrap ${urgency.badge}`}>{urgency.label}</span>
                              </div>
                              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{stripHtml(n.summary) || n.summary}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span className="material-symbols-outlined text-[14px]">person</span>
                                  <span>{sender}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                                  <span>{timeLabel}</span>
                                </div>
                                {isRead && (
                                  <div className="ml-auto p-2 rounded-lg bg-green-50 text-green-600 flex items-center gap-1.5" title="Đã đọc">
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    <span className="text-xs font-medium">Đã đọc</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {!loading && userFilteredByUrgency.length === 0 && (
                    <div className="text-center py-12 text-slate-500">Chưa có thông báo nào.</div>
                  )}
                  {!loading && userFilteredByUrgency.length > 0 && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        className="px-8 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-[#137fec] hover:bg-white border border-slate-200 bg-white shadow-sm transition-all"
                      >
                        Xem thông báo cũ hơn
                      </button>
                    </div>
                  )}
                  </div>
                </div>
                {/* Modal chi tiết thông báo — cùng viewMode === 'mine' */}
                {detailModal && (
                  <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => setDetailModal(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-900">Chi tiết thông báo</h3>
                        <button type="button" onClick={() => setDetailModal(null)} className="text-slate-500 hover:text-red-500 transition-colors p-1">
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`size-14 rounded-2xl ${getNotificationIcon(detailModal.title).bg} ${getNotificationIcon(detailModal.title).text} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-3xl">{getNotificationIcon(detailModal.title).icon}</span>
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">{detailModal.title}</h2>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {(detailModal.title || '').toLowerCase().includes('trả sách') && getBorrowRecorderNameFromSummary(detailModal.summary || '') && (
                                <>
                                  <span className="text-sm text-slate-500">Người ghi mượn sách: <strong>{getBorrowRecorderNameFromSummary(detailModal.summary || '')}</strong></span>
                                  <span className="size-1 rounded-full bg-slate-200" />
                                </>
                              )}
                              <span className="text-sm text-slate-500">{getSenderLabelForNotification(detailModal.title)}: <strong>{detailModal.senderLabel || getSenderLabel(currentUserPermission)}</strong></span>
                              <span className="size-1 rounded-full bg-slate-200" />
                              <span className="text-sm text-slate-500">{detailModal.scheduledDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-900 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 whitespace-pre-line text-[15px] leading-7">
                          {(detailModal.summary || '')
                            .split('\n')
                            .filter(line => !line.trimStart().startsWith('Người ghi mượn sách:'))
                            .join('\n')}
                        </div>
                      </div>
                      <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        {readIds.has(Number(detailModal.id)) ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 bg-green-50 border border-green-200 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Đã đọc
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              markAsRead(detailModal.id)
                              setDetailModal(null)
                            }}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#137fec] hover:bg-[#0f6fd6] transition-all"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
              )}

            {/* View: Quản lý Thông báo (admin) — layout hài hoà với view Thông báo của tôi */}
            {viewMode === 'manage' && (
            <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
              <div className="flex flex-col gap-2">
                <h1 className="text-slate-900 text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                  Quản lý Thông báo
                </h1>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Tạo, chỉnh sửa và theo dõi các thông báo nội bộ và công khai cho thành viên.
                </p>
              </div>
              {userCanPost && (
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    setFormNotif({ title: '', summary: '', audience: '', type: 'internal', urgency: 'normal', scheduledDate: '', scheduledTime: '' })
                    setShowCreateForm(!showCreateForm)
                  }}
                  className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span className="truncate">Tạo thông báo mới</span>
                </button>
              </div>
              )}
            </div>
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 size-12 shrink-0">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-500 text-sm font-medium">Tổng thông báo</p>
                  <h3 className="text-slate-900 text-2xl font-bold">{loading ? '...' : totalCount}</h3>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center rounded-lg bg-green-50 text-green-600 size-12 shrink-0">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-500 text-sm font-medium">Đã gửi</p>
                  <h3 className="text-slate-900 text-2xl font-bold">{sentCount}</h3>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 size-12 shrink-0">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-500 text-sm font-medium">Lên lịch</p>
                  <h3 className="text-slate-900 text-2xl font-bold">{scheduledCount}</h3>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 size-12 shrink-0">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-500 text-sm font-medium">Bản nháp</p>
                  <h3 className="text-slate-900 text-2xl font-bold">{draftCount}</h3>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[250px]">
                <p className="text-slate-900 text-sm font-semibold mb-2">Tìm kiếm thông báo</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề hoặc nội dung cần tìm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                </div>
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-slate-900 text-sm font-semibold mb-2">Trạng thái</p>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="sent">Đã gửi</option>
                    <option value="scheduled">Đang lên lịch</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="text-slate-900 text-sm font-semibold mb-2">Loại thông báo</p>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                  >
                    <option value="">Tất cả loại</option>
                    <option value="internal">Nội bộ</option>
                    <option value="public">Công khai</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[28%]">Tiêu đề thông báo</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[12%]">Loại</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[12%]">Đối tượng</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[15%]">Đã đọc</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[15%]">Chưa đọc</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[13%]">Ngày lên lịch</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[10%]">Trạng thái</th>
                      <th className="px-6 py-4 text-right w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr><td colSpan={8} className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-3xl text-[#137fec]">progress_activity</span></td></tr>
                    ) : (
                    filteredNotifications.map(notification => {
                      const statusMeta = getStatusLabel(notification.status)
                      const typeMeta = getTypeLabel(notification.type)
                      const toAccount = (x: unknown): { name: string; email: string } =>
                        typeof x === 'object' && x !== null && 'name' in x
                          ? { name: (x as { name: string }).name, email: (x as { email?: string }).email ?? '' }
                          : { name: String(x), email: '' }
                      const readBy = (notification.readBy ?? []).map(toAccount)
                      const unreadBy = (notification.unreadBy ?? []).map(toAccount)
                      const formatAccount = (x: { name: string; email: string }) =>
                        x.email ? `${x.name} (${x.email})` : x.name
                      return (
                        <tr key={notification.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-900 text-sm font-semibold">{notification.title}</span>
                              <span className="text-slate-500 text-xs mt-1 truncate max-w-[250px]">{stripHtml(notification.summary) || notification.summary}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${typeMeta.color}`}>
                              {typeMeta.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm font-medium">{notification.audience}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {readBy.length === 0 ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-700 font-medium">{readBy.length} người</span>
                                <button
                                  type="button"
                                  onClick={() => setListModal({ title: 'Đã đọc', items: readBy })}
                                  className="text-[#137fec] hover:underline text-sm font-medium"
                                >
                                  Xem
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {unreadBy.length === 0 ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-700 font-medium">{unreadBy.length} người</span>
                                <button
                                  type="button"
                                  onClick={() => setListModal({ title: 'Chưa đọc', items: unreadBy })}
                                  className="text-[#137fec] hover:underline text-sm font-medium"
                                >
                                  Xem
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{notification.scheduledDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full ${statusMeta.bg}`}></div>
                              <span className={`text-sm font-bold ${statusMeta.color}`}>{statusMeta.text}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {userCanPost ? (
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleOpenEdit(notification)}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteNotification(notification)}
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                            ) : (
                            <span className="text-slate-400 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <span className="text-sm text-slate-500 font-medium">Hiển thị 1-{filteredNotifications.length} trong số {totalCount} thông báo</span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary transition-all disabled:opacity-50">
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal danh sách Đã đọc / Chưa đọc */}
            {listModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setListModal(null)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">{listModal.title}</h3>
                    <button type="button" onClick={() => setListModal(null)} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-2">
                    {listModal.items.map((x, i) => (
                      <div key={i} className="text-sm text-slate-700 py-1.5 border-b border-slate-100 last:border-0">
                        {x.email ? `${x.name} (${x.email})` : x.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Sửa thông báo — bố cục giống Tạo thông báo mới */}
            {showEditModal && editingNotif && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => !submitting && setShowEditModal(false)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa thông báo</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin thông báo</p>
                    </div>
                    <button type="button" onClick={() => !submitting && setShowEditModal(false)} className="text-slate-500 hover:text-red-500 transition-colors p-1">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <form onSubmit={handleUpdateNotification} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <label className="block text-sm font-bold text-slate-900 mb-2">Tiêu đề thông báo <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formNotif.title}
                        onChange={e => setFormNotif(p => ({ ...p, title: e.target.value }))}
                        placeholder="Ví dụ: Thông báo họp định kỳ tuần 45..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                    <div className="col-span-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-5 md:p-6">
                      <p className="text-sm font-bold text-slate-700 mb-5">Phạm vi, đối tượng & mức độ</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(0,180px)] gap-5 md:gap-6">
                        <div className="min-w-0 space-y-3">
                          <label className="block text-sm font-bold text-slate-900">Phạm vi thông báo</label>
                          <div className="flex gap-3 flex-wrap">
                            <label className="flex items-center justify-center min-h-[48px] min-w-[120px] flex-1 px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all bg-white">
                              <input type="radio" name="editType" checked={formNotif.type === 'internal'} onChange={() => setFormNotif(p => ({ ...p, type: 'internal' }))} className="w-5 h-5 shrink-0 text-primary focus:ring-primary" />
                              <span className="ml-2 text-sm font-semibold whitespace-nowrap">Nội bộ CLB</span>
                            </label>
                            <label className="flex items-center justify-center min-h-[48px] min-w-[120px] flex-1 px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all bg-white">
                              <input type="radio" name="editType" checked={formNotif.type === 'public'} onChange={() => setFormNotif(p => ({ ...p, type: 'public' }))} className="w-5 h-5 shrink-0 text-primary focus:ring-primary" />
                              <span className="ml-2 text-sm font-semibold whitespace-nowrap">Công khai</span>
                            </label>
                          </div>
                        </div>
                        <div className="min-w-0 space-y-3 lg:col-span-1">
                          <label className="block text-sm font-bold text-slate-900">Đối tượng nhận tin</label>
                          <div className="relative">
                            <select
                              value={formNotif.audience}
                              onChange={e => setFormNotif(p => ({ ...p, audience: e.target.value }))}
                              className="w-full min-h-[48px] pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all bg-white text-sm"
                            >
                              <option value="">-- Chọn đối tượng --</option>
                              {allowedAudienceOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                          </div>
                          <p className="text-xs text-slate-500">Gửi đến người dùng = thành viên thường. Tất cả thành viên = toàn bộ CLB.</p>
                        </div>
                        <div className="min-w-0 space-y-2 md:col-span-2 lg:col-span-1 lg:w-[180px]">
                          <label className="block text-sm font-bold text-slate-900">Mức độ</label>
                          <select
                            value={formNotif.urgency}
                            onChange={e => setFormNotif(p => ({ ...p, urgency: (e.target.value as UrgencyLevel) || 'normal' }))}
                            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all bg-white text-sm"
                          >
                            <option value="normal">Thường</option>
                            <option value="important">Quan trọng</option>
                            <option value="urgent">Khẩn</option>
                          </select>
                          <p className="text-[11px] text-slate-500 leading-tight">Khẩn / Quan trọng / Thường.</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-full">
                      <label className="block text-sm font-bold text-slate-900 mb-2">Nội dung chi tiết</label>
                      <p className="text-xs text-slate-500 mb-2">
                        Gợi ý: Chọn chữ rồi bấm <strong>In đậm</strong> hoặc <strong>In nghiêng</strong>. Đặt con trỏ tại dòng (hoặc chọn nhiều dòng) rồi bấm <strong>Danh sách</strong> để tạo gạch đầu dòng. Chọn chữ rồi bấm <strong>Link</strong> để chèn liên kết.
                      </p>
                      <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                        <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200">
                          <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); saveSelection(editEditorRef) }} onClick={(e) => { e.preventDefault(); execEditorCommand(editEditorRef, 'bold') }} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors" title="In đậm">
                            <span className="material-symbols-outlined text-[20px]">format_bold</span>
                          </button>
                          <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); saveSelection(editEditorRef) }} onClick={(e) => { e.preventDefault(); execEditorCommand(editEditorRef, 'italic') }} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors" title="In nghiêng">
                            <span className="material-symbols-outlined text-[20px]">format_italic</span>
                          </button>
                          <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); saveSelection(editEditorRef) }} onClick={(e) => { e.preventDefault(); execEditorCommand(editEditorRef, 'insertUnorderedList') }} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors" title="Danh sách gạch đầu dòng">
                            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                          </button>
                          <button type="button" tabIndex={-1} onMouseDown={(e) => { e.preventDefault(); saveSelection(editEditorRef) }} onClick={(e) => { e.preventDefault(); const url = window.prompt('Nhập URL liên kết:', 'https://'); if (url) execEditorCommand(editEditorRef, 'createLink', url) }} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors" title="Chèn liên kết">
                            <span className="material-symbols-outlined text-[20px]">link</span>
                          </button>
                        </div>
                        <div ref={editEditorRef} contentEditable suppressContentEditableWarning data-placeholder="Nhập nội dung chi tiết của thông báo..." className="w-full min-h-[160px] px-4 py-3 border-none bg-white focus:outline-none focus:ring-0 [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-slate-400" />
                      </div>
                    </div>
                    <div className="col-span-full">
                      <label className="block text-sm font-bold text-slate-900 mb-3">Thời gian đăng tin</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <DatePickerButton
                            value={formNotif.scheduledDate}
                            onChange={(v) => setFormNotif((p) => ({ ...p, scheduledDate: v }))}
                            placeholder="Chọn ngày"
                            className="h-auto py-3 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                          />
                        </div>
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">schedule</span>
                          <input type="time" value={formNotif.scheduledTime} onChange={e => setFormNotif(p => ({ ...p, scheduledTime: e.target.value }))} className="w-full pl-11 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-full flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                      <button type="button" onClick={() => !submitting && setShowEditModal(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                        Hủy bỏ
                      </button>
                      <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#137fec] hover:bg-[#0f6fd6] shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {submitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Tạo thông báo */}
            {showCreateForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => !submitting && setShowCreateForm(false)}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Tạo thông báo mới</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Vui lòng điền đầy đủ các thông tin cần thiết</p>
                    </div>
                    <button 
                      onClick={() => !submitting && setShowCreateForm(false)}
                      className="text-slate-500 hover:text-red-500 transition-colors p-1"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateNotification('sent') }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Tiêu đề thông báo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Thông báo họp định kỳ tuần 45..."
                      value={formNotif.title}
                      onChange={e => setFormNotif(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>
                  <div className="col-span-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-5 md:p-6">
                    <p className="text-sm font-bold text-slate-700 mb-5">Phạm vi, đối tượng & mức độ</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(0,180px)] gap-5 md:gap-6">
                      <div className="min-w-0 space-y-3">
                        <label className="block text-sm font-bold text-slate-900">Phạm vi thông báo</label>
                        <div className="flex gap-3 flex-wrap">
                          <label className="flex items-center justify-center min-h-[48px] min-w-[120px] flex-1 px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all bg-white">
                            <input type="radio" name="type" checked={formNotif.type === 'internal'} onChange={() => setFormNotif(p => ({ ...p, type: 'internal' }))} className="w-5 h-5 shrink-0 text-primary focus:ring-primary" />
                            <span className="ml-2 text-sm font-semibold whitespace-nowrap">Nội bộ CLB</span>
                          </label>
                          <label className="flex items-center justify-center min-h-[48px] min-w-[120px] flex-1 px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-all bg-white">
                            <input type="radio" name="type" checked={formNotif.type === 'public'} onChange={() => setFormNotif(p => ({ ...p, type: 'public' }))} className="w-5 h-5 shrink-0 text-primary focus:ring-primary" />
                            <span className="ml-2 text-sm font-semibold whitespace-nowrap">Công khai</span>
                          </label>
                        </div>
                      </div>
                      <div className="min-w-0 space-y-3 lg:col-span-1">
                        <label className="block text-sm font-bold text-slate-900">Đối tượng nhận tin</label>
                        <div className="relative">
                          <select 
                            value={formNotif.audience} 
                            onChange={e => setFormNotif(p => ({ ...p, audience: e.target.value }))}
                            className="w-full min-h-[48px] pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all bg-white text-sm"
                          >
                            <option value="">-- Chọn đối tượng --</option>
                            {allowedAudienceOptions.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                        </div>
                        <p className="text-xs text-slate-500">Gửi đến người dùng = thành viên thường. Tất cả thành viên = toàn bộ CLB.</p>
                      </div>
                      <div className="min-w-0 space-y-2 md:col-span-2 lg:col-span-1 lg:w-[180px]">
                        <label className="block text-sm font-bold text-slate-900">Mức độ</label>
                        <select
                          value={formNotif.urgency}
                          onChange={e => setFormNotif(p => ({ ...p, urgency: (e.target.value as UrgencyLevel) || 'normal' }))}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all bg-white text-sm"
                        >
                          <option value="normal">Thường</option>
                          <option value="important">Quan trọng</option>
                          <option value="urgent">Khẩn</option>
                        </select>
                        <p className="text-[11px] text-slate-500 leading-tight">Khẩn / Quan trọng / Thường.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-2">Nội dung chi tiết</label>
                    <p className="text-xs text-slate-500 mb-2">
                      Gợi ý: Chọn chữ rồi bấm <strong>In đậm</strong> hoặc <strong>In nghiêng</strong>. Đặt con trỏ tại dòng (hoặc chọn nhiều dòng) rồi bấm <strong>Danh sách</strong> để tạo gạch đầu dòng. Chọn chữ rồi bấm <strong>Link</strong> để chèn liên kết.
                    </p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200">
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => { e.preventDefault(); saveSelection(createEditorRef) }}
                          onClick={(e) => { e.preventDefault(); execEditorCommand(createEditorRef, 'bold') }}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                          title="In đậm: chọn chữ rồi bấm"
                        >
                          <span className="material-symbols-outlined text-[20px]">format_bold</span>
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => { e.preventDefault(); saveSelection(createEditorRef) }}
                          onClick={(e) => { e.preventDefault(); execEditorCommand(createEditorRef, 'italic') }}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                          title="In nghiêng: chọn chữ rồi bấm"
                        >
                          <span className="material-symbols-outlined text-[20px]">format_italic</span>
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => { e.preventDefault(); saveSelection(createEditorRef) }}
                          onClick={(e) => { e.preventDefault(); execEditorCommand(createEditorRef, 'insertUnorderedList') }}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                          title="Danh sách gạch đầu dòng: đặt con trỏ tại dòng (hoặc chọn nhiều dòng) rồi bấm"
                        >
                          <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => { e.preventDefault(); saveSelection(createEditorRef) }}
                          onClick={(e) => {
                            e.preventDefault()
                            const url = window.prompt('Nhập URL liên kết:', 'https://')
                            if (url) execEditorCommand(createEditorRef, 'createLink', url)
                          }}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
                          title="Chèn liên kết: chọn chữ rồi bấm, nhập URL khi được hỏi"
                        >
                          <span className="material-symbols-outlined text-[20px]">link</span>
                        </button>
                      </div>
                      <div
                        ref={createEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Nhập nội dung chi tiết của thông báo..."
                        className="w-full min-h-[160px] px-4 py-3 border-none bg-white focus:outline-none focus:ring-0 [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-3">Thời gian đăng tin</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <DatePickerButton
                          value={formNotif.scheduledDate}
                          onChange={(v) => setFormNotif((p) => ({ ...p, scheduledDate: v }))}
                          placeholder="Chọn ngày"
                          className="h-auto py-3 rounded-xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">schedule</span>
                        <input
                          type="time"
                          value={formNotif.scheduledTime}
                          onChange={e => setFormNotif(p => ({ ...p, scheduledTime: e.target.value }))}
                          className="w-full pl-11 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                    <button type="button" onClick={() => !submitting && setShowCreateForm(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">
                      Hủy bỏ
                    </button>
                    <button type="button" onClick={() => handleCreateNotification('draft')} disabled={submitting} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                      Lưu vào nháp
                    </button>
                    <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#137fec] hover:bg-[#0f6fd6] shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                      Xác nhận & Gửi
                    </button>
                  </div>
                </form>
                </div>
              </div>
            )}
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </RequireAuth>
  )
  return content
}
