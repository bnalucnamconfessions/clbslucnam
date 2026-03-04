import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import DatePickerButton from '@/components/DatePickerButton'
import { apiUrl, apiUrlWithAuth, getApiAuth } from '@/lib/api'
import { logActivity } from '@/lib/activityLog'
import { useRefetchOnFocusAndInterval } from '@/lib/refetch'
import { formatBookId } from '@/lib/bookId'
import { getInitials } from '@/lib/initials'

/** Quản trị viên và Ban chủ nhiệm có quyền như nhau. Trưởng ban thuộc BCN; Phó ban thuộc các ban (không thuộc BCN). */
const CAN_MANAGE_ACCOUNTS: string[] = ['admin', 'chairperson', 'vice_chairperson', 'head_hr_finance', 'vice_head_hr_finance', 'member_hr_finance']

/** Chỉ Quản trị viên, Chủ nhiệm, Phó chủ nhiệm, Trưởng/Phó ban Nhân sự - Tài Chính mới xem được cột Lịch sử thao tác. */
const CAN_VIEW_ACTIVITY_LOG: string[] = ['admin', 'chairperson', 'vice_chairperson', 'head_hr_finance', 'vice_head_hr_finance']

/** Ban chủ nhiệm: Chủ nhiệm, Phó chủ nhiệm và các Trưởng ban. Phó ban không thuộc BCN nhưng vẫn thuộc từng ban (QL Sách, TT-ĐN, NS-TC). */
const BAN_CHU_NHIEM: string[] = ['admin', 'chairperson', 'vice_chairperson', 'head_book', 'head_communication', 'head_hr_finance']

interface Member {
  id: string
  name: string
  userId: string
  email?: string
  avatar?: string
  avatarUrl?: string | null
  department: string
  role: string
  joinDate: string
  status: 'active' | 'inactive'
}

interface Account {
  id: number
  email: string
  fullName: string
  avatarUrl: string | null
  provider: string
  clubPermission: string
  lastLoginAt: string
  createdAt: string
}

const PERMISSION_OPTIONS: { value: string; label: string; department: string; role: string }[] = [
  { value: 'admin', label: 'Quản trị viên', department: '', role: 'Quản trị viên' },
  { value: 'chairperson', label: 'Chủ nhiệm', department: 'Ban Chủ nhiệm', role: 'Chủ nhiệm' },
  { value: 'vice_chairperson', label: 'Phó chủ nhiệm', department: 'Ban Chủ nhiệm', role: 'Phó chủ nhiệm' },
  { value: 'head_book', label: 'Trưởng ban Quản Lý Sách', department: 'Ban Quản lý sách', role: 'Trưởng ban Quản Lý Sách' },
  { value: 'vice_head_book', label: 'Phó ban Quản Lý Sách', department: 'Ban Quản lý sách', role: 'Phó ban Quản Lý Sách' },
  { value: 'head_communication', label: 'Trưởng ban Truyền thông - Đối Ngoại', department: 'Ban Truyền thông - Đối Ngoại', role: 'Trưởng ban Truyền thông - Đối Ngoại' },
  { value: 'vice_head_communication', label: 'Phó ban Truyền thông - Đối Ngoại', department: 'Ban Truyền thông - Đối Ngoại', role: 'Phó ban Truyền thông - Đối Ngoại' },
  { value: 'head_hr_finance', label: 'Trưởng ban Nhân sự - Tài Chính', department: 'Ban Nhân sự - Tài Chính', role: 'Trưởng ban Nhân sự - Tài Chính' },
  { value: 'vice_head_hr_finance', label: 'Phó ban Nhân sự - Tài Chính', department: 'Ban Nhân sự - Tài Chính', role: 'Phó ban Nhân sự - Tài Chính' },
  { value: 'member_book', label: 'Thành viên ban Quản lý sách', department: 'Ban Quản lý sách', role: 'Thành viên ban Quản lý sách' },
  { value: 'member_communication', label: 'Thành viên ban Truyền thông - Đối Ngoại', department: 'Ban Truyền thông - Đối Ngoại', role: 'Thành viên ban Truyền thông - Đối Ngoại' },
  { value: 'member_hr_finance', label: 'Thành viên ban Nhân sự - Tài Chính', department: 'Ban Nhân sự - Tài Chính', role: 'Thành viên ban Nhân sự - Tài Chính' },
  { value: 'user', label: 'Người dùng', department: '', role: 'Người dùng' },
]

const PERM_LABELS: Record<string, string> = Object.fromEntries(PERMISSION_OPTIONS.map(p => [p.value, p.label]))

/** Rút trạng thái từ chuỗi chi tiết (vd. "Nội dung: ... | Trạng thái: Đã xác nhận") */
function getStatusFromDetails(details: string): string | null {
  if (!details?.trim()) return null
  const m = details.match(/Trạng thái:\s*([^|]+)/)
  return m ? m[1].trim() : null
}

const PERM_SHORT_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  chairperson: 'Chủ nhiệm',
  vice_chairperson: 'Phó chủ nhiệm',
  head_book: 'Tr. ban QL Sách',
  vice_head_book: 'Phó ban QL Sách',
  head_communication: 'Tr. ban TT-ĐN',
  vice_head_communication: 'Phó ban TT-ĐN',
  head_hr_finance: 'Tr. ban NS-TC',
  vice_head_hr_finance: 'Phó ban NS-TC',
  member_book: 'TV QL Sách',
  member_communication: 'TV TT-ĐN',
  member_hr_finance: 'TV NS-TC',
  user: 'Người dùng',
}

/** Nhóm phân quyền: BCN = trưởng ban; mỗi ban (QL Sách, TT-ĐN, NS-TC) gồm Trưởng ban + Phó ban + Thành viên thuộc ban đó. */
const PERMISSION_GROUPS: { groupLabel: string; options: typeof PERMISSION_OPTIONS }[] = [
  { groupLabel: 'Quản trị & Ban chủ nhiệm', options: PERMISSION_OPTIONS.filter(p => BAN_CHU_NHIEM.includes(p.value)) },
  { groupLabel: 'Ban Quản lý sách', options: PERMISSION_OPTIONS.filter(p => ['head_book', 'vice_head_book', 'member_book'].includes(p.value)) },
  { groupLabel: 'Ban Truyền thông - Đối Ngoại', options: PERMISSION_OPTIONS.filter(p => ['head_communication', 'vice_head_communication', 'member_communication'].includes(p.value)) },
  { groupLabel: 'Ban Nhân sự - Tài Chính', options: PERMISSION_OPTIONS.filter(p => ['head_hr_finance', 'vice_head_hr_finance', 'member_hr_finance'].includes(p.value)) },
  { groupLabel: 'Khác', options: PERMISSION_OPTIONS.filter(p => p.value === 'user') },
]

function getPermissionFromMember(department: string, role: string): string {
  const found = PERMISSION_OPTIONS.find(p => p.department === department && p.role === role)
  if (found) return found.value
  if (role === 'Phó chủ nhiệm' || role?.includes('Phó chủ nhiệm')) return 'vice_chairperson'
  if ((department === 'Ban Chủ nhiệm' || role === 'Chủ nhiệm') && role?.includes('Chủ nhiệm')) return 'chairperson'
  if (role?.startsWith('Phó ban') && department === 'Ban Quản lý sách') return 'vice_head_book'
  if (role?.startsWith('Phó ban') && department === 'Ban Truyền thông - Đối Ngoại') return 'vice_head_communication'
  if (role?.startsWith('Phó ban') && department === 'Ban Nhân sự - Tài Chính') return 'vice_head_hr_finance'
  if (role?.startsWith('Trưởng ban') && department === 'Ban Quản lý sách') return 'head_book'
  if (role?.startsWith('Trưởng ban') && department === 'Ban Truyền thông - Đối Ngoại') return 'head_communication'
  if (role?.startsWith('Trưởng ban') && department === 'Ban Nhân sự - Tài Chính') return 'head_hr_finance'
  if (role?.startsWith('Thành viên') && department === 'Ban Quản lý sách') return 'member_book'
  if (role?.startsWith('Thành viên') && department === 'Ban Truyền thông - Đối Ngoại') return 'member_communication'
  if (role?.startsWith('Thành viên') && department === 'Ban Nhân sự - Tài Chính') return 'member_hr_finance'
  return 'user'
}

export default function ThanhVienPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'accounts'>('members')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPermission, setFilterPermission] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formMember, setFormMember] = useState({
    name: '',
    userId: '',
    permission: 'user',
    department: '',
    role: '',
    status: 'active' as 'active' | 'inactive',
    joinDate: '',
  })

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [currentUserPermission, setCurrentUserPermission] = useState<string>('user')
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountEditPermission, setAccountEditPermission] = useState<string>('user')
  const [updatingPermission, setUpdatingPermission] = useState(false)
  const [accountPermissionDropdownOpen, setAccountPermissionDropdownOpen] = useState(false)
  const accountPermissionDropdownRef = useRef<HTMLDivElement>(null)
  const [editMemberPermissionDropdownOpen, setEditMemberPermissionDropdownOpen] = useState(false)
  const editMemberPermissionDropdownRef = useRef<HTMLDivElement>(null)
  const [addMemberPermissionDropdownOpen, setAddMemberPermissionDropdownOpen] = useState(false)
  const addMemberPermissionDropdownRef = useRef<HTMLDivElement>(null)
  const [logModalEmail, setLogModalEmail] = useState<string | null>(null)
  const [logModalLabel, setLogModalLabel] = useState<string>('')
  const [activityLogsForModal, setActivityLogsForModal] = useState<{ id: number; action: string; details: string; createdAt: string }[]>([])
  const [loadingLogsForModal, setLoadingLogsForModal] = useState(false)
  const [expandedLogDetailId, setExpandedLogDetailId] = useState<number | null>(null)

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('userInfo')
        if (raw) {
          const p = JSON.parse(raw)
          setCurrentUserPermission(p.clubPermission || 'user')
        }
      } catch {
        setCurrentUserPermission('user')
      }
    }
    load()
    window.addEventListener('userInfoUpdated', load)
    return () => window.removeEventListener('userInfoUpdated', load)
  }, [])

  const canManageAccounts = CAN_MANAGE_ACCOUNTS.includes(currentUserPermission)
  const canViewActivityLog = CAN_VIEW_ACTIVITY_LOG.includes(currentUserPermission)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth('/api/members'), { headers })
      if (!res.ok) throw new Error('Lỗi tải danh sách thành viên')
      const data = await res.json()
      setMembers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không kết nối được backend')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth('/api/accounts'), { headers })
      if (!res.ok) throw new Error('Lỗi tải danh sách tài khoản')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch {
      setAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (activeTab === 'accounts') fetchAccounts()
  }, [activeTab])

  useRefetchOnFocusAndInterval(() => {
    fetchMembers()
    fetchAccounts()
  }, { intervalMs: 20 * 1000 })

  const openActivityLogModal = async (email: string, label: string) => {
    setLogModalEmail(email)
    setLogModalLabel(label)
    setActivityLogsForModal([])
    setExpandedLogDetailId(null)
    setLoadingLogsForModal(true)
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/activity-log?email=${encodeURIComponent(email)}`), { headers })
      if (res.ok) {
        const data = await res.json()
        setActivityLogsForModal(Array.isArray(data) ? data : [])
      } else {
        setActivityLogsForModal([])
      }
    } catch {
      setActivityLogsForModal([])
    } finally {
      setLoadingLogsForModal(false)
    }
  }

  const closeActivityLogModal = () => {
    setLogModalEmail(null)
    setLogModalLabel('')
    setExpandedLogDetailId(null)
  }

  useEffect(() => {
    if (!accountPermissionDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (accountPermissionDropdownRef.current && !accountPermissionDropdownRef.current.contains(e.target as Node)) {
        setAccountPermissionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [accountPermissionDropdownOpen])

  useEffect(() => {
    if (!editMemberPermissionDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (editMemberPermissionDropdownRef.current && !editMemberPermissionDropdownRef.current.contains(e.target as Node)) {
        setEditMemberPermissionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editMemberPermissionDropdownOpen])

  useEffect(() => {
    if (!addMemberPermissionDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (addMemberPermissionDropdownRef.current && !addMemberPermissionDropdownRef.current.contains(e.target as Node)) {
        setAddMemberPermissionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [addMemberPermissionDropdownOpen])

  useEffect(() => {
    const onProfileSaved = () => {
      if (activeTab === 'accounts') fetchAccounts()
    }
    window.addEventListener('userInfoUpdated', onProfileSaved)
    return () => window.removeEventListener('userInfoUpdated', onProfileSaved)
  }, [activeTab])

  const handleDeleteAccount = async (acc: Account) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${acc.fullName || acc.email}"?`)) return
    setError(null)
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/accounts/${acc.id}/delete`), { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi xóa tài khoản')
      }
      logActivity('Xóa tài khoản', `Tên: ${acc.fullName || '—'} | Email: ${acc.email || '—'}`)
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id))
      fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    }
  }

  const handleUpdateAccountPermission = async (accountId: number, clubPermission: string) => {
    let accountEmail = ''
    try {
      const raw = localStorage.getItem('userInfo')
      if (raw) {
        const parsed = JSON.parse(raw)
        accountEmail = (parsed.accountEmail || parsed.email || '').trim()
      }
    } catch { /* ignore */ }
    try {
      const res = await fetch(apiUrl(`/api/accounts/${accountId}/permission`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubPermission, accountEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi cập nhật quyền')
      }
      logActivity('Cập nhật quyền thành viên', editingAccount ? `Tài khoản: ${editingAccount.fullName || editingAccount.email || '—'} | Quyền mới: ${PERM_LABELS[clubPermission] || clubPermission}` : `Quyền: ${clubPermission}`)
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, clubPermission } : a))
      )
      fetchMembers()
      // Nếu đang đổi quyền chính tài khoản đăng nhập thì cập nhật localStorage để Sidebar và Hồ sơ cập nhật ngay
      try {
        const raw = localStorage.getItem('userInfo')
        if (raw && editingAccount) {
          const parsed = JSON.parse(raw)
          const currentEmail = (parsed.accountEmail || parsed.email || '').trim()
          if (currentEmail && (editingAccount.email === currentEmail)) {
            const newRole = PERM_LABELS[clubPermission] || parsed.role || 'Người dùng'
            const next = { ...parsed, clubPermission, role: newRole }
            localStorage.setItem('userInfo', JSON.stringify(next))
            localStorage.setItem('adminRole', newRole)
            window.dispatchEvent(new Event('userInfoUpdated'))
          }
        }
      } catch {
        /* ignore */
      }
      setEditingAccount(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi cập nhật quyền')
    } finally {
      setUpdatingPermission(false)
    }
  }

  const openAccountEditModal = (acc: Account) => {
    setEditingAccount(acc)
    setAccountEditPermission(acc.clubPermission || 'user')
    setAccountPermissionDropdownOpen(false)
  }

  const handleSaveAccountPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return
    setUpdatingPermission(true)
    await handleUpdateAccountPermission(editingAccount.id, accountEditPermission)
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMember.name.trim() || !formMember.userId.trim()) {
      alert('Vui lòng nhập tên và mã thành viên')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl('/api/members/create'), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formMember.name,
          userId: formMember.userId,
          department: PERMISSION_OPTIONS.find(p => p.value === formMember.permission)?.department ?? formMember.department,
          role: PERMISSION_OPTIONS.find(p => p.value === formMember.permission)?.role ?? formMember.role,
          status: formMember.status,
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi thêm thành viên')
      }
      logActivity('Thêm thành viên', formMember.name)
      setShowAddModal(false)
      setFormMember({ name: '', userId: '', permission: 'user', department: '', role: '', status: 'active', joinDate: '' })
      fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const parseJoinDateForForm = (joinDate: string) => {
    if (!joinDate) return ''
    const match = joinDate.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) {
      const [, d, m, y] = match
      return `${y}-${m}-${d}`
    }
    return ''
  }

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Bạn có chắc muốn xóa thành viên "${member.name}"?`)) return
    setError(null)
    try {
      const { headers } = getApiAuth()
      const res = await fetch(apiUrlWithAuth(`/api/members/${member.id}/delete`), { method: 'DELETE', headers })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi xóa thành viên')
      }
      logActivity('Xóa thành viên', `Tên: ${member.name} | Mã: ${member.userId || '—'} | Ban: ${member.department || '—'}`)
      setShowEditModal(false)
      setEditingMember(null)
      fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    }
  }

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member)
    setFormMember({
      name: member.name,
      userId: member.userId,
      permission: getPermissionFromMember(member.department || '', member.role || ''),
      department: member.department || '',
      role: member.role || '',
      status: member.status,
      joinDate: parseJoinDateForForm(member.joinDate),
    })
    setEditMemberPermissionDropdownOpen(false)
    setShowEditModal(true)
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember || !formMember.name.trim() || !formMember.userId.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const perm = PERMISSION_OPTIONS.find(p => p.value === formMember.permission)
      const { headers, accountEmail } = getApiAuth()
      const res = await fetch(apiUrl(`/api/members/${editingMember.id}`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formMember.name,
          userId: formMember.userId,
          department: perm?.department ?? formMember.department,
          role: perm?.role ?? formMember.role,
          clubPermission: formMember.permission,
          status: formMember.status,
          joinDate: formMember.joinDate || undefined,
          accountEmail: accountEmail || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Lỗi cập nhật thành viên')
      }
      const permLabel = PERMISSION_OPTIONS.find(p => p.value === formMember.permission)?.label || formMember.permission
      logActivity('Cập nhật thành viên', `Tên: ${formMember.name} | Mã: ${formMember.userId} | Quyền: ${permLabel}`)
      setShowEditModal(false)
      setEditingMember(null)
      setFormMember({ name: '', userId: '', permission: 'user', department: '', role: '', status: 'active', joinDate: '' })
      fetchMembers()
      fetchAccounts()
      // Nếu thành viên vừa sửa là tài khoản đang đăng nhập (userId = id số tài khoản) thì cập nhật localStorage để Sidebar đổi menu ngay
      const uid = (editingMember.userId || '').trim().replace(/^acc-/, '')
      const accId = /^\d+$/.test(uid) ? parseInt(uid, 10) : NaN
      if (!Number.isNaN(accId)) {
        try {
          const { headers: authHeaders } = getApiAuth()
          const accountsRes = await fetch(apiUrlWithAuth('/api/accounts'), { headers: authHeaders })
          if (accountsRes.ok) {
            const accountsList: Account[] = await accountsRes.json()
            const acc = Array.isArray(accountsList) ? accountsList.find((a: Account) => a.id === accId) : null
            const raw = localStorage.getItem('userInfo')
            if (raw && acc) {
              const parsed = JSON.parse(raw)
              const currentEmail = (parsed.accountEmail || parsed.email || '').trim()
              if (currentEmail && (acc.email === currentEmail || (acc as { display_email?: string }).display_email === currentEmail)) {
                const newRole = PERM_LABELS[formMember.permission] || parsed.role || 'Người dùng'
                const next = { ...parsed, clubPermission: formMember.permission, role: newRole }
                localStorage.setItem('userInfo', JSON.stringify(next))
                localStorage.setItem('adminRole', newRole)
                window.dispatchEvent(new Event('userInfoUpdated'))
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const membersWithRole = members.filter(m => getPermissionFromMember(m.department || '', m.role || '') !== 'user')
  const newThisMonth = membersWithRole.filter(m => {
    if (!m.joinDate) return false
    const [d, mo, y] = (m.joinDate || '').split('/').map(Number)
    return y === thisYear && mo === thisMonth + 1
  }).length
  const stats = {
    total: membersWithRole.length,
    newThisMonth,
    active: membersWithRole.filter(m => m.status === 'active').length,
    inactive: membersWithRole.filter(m => m.status === 'inactive').length
  }

  /** Màu badge theo phân quyền (đồng bộ với bảng Tài khoản đăng nhập). */
  const getPermissionBadgeClass = (perm: string) => {
    if (BAN_CHU_NHIEM.includes(perm || '')) return 'bg-purple-50 text-purple-700 border-purple-200'
    if (['vice_head_book', 'vice_head_communication', 'vice_head_hr_finance'].includes(perm || '')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (['member_book', 'member_communication', 'member_hr_finance'].includes(perm || '')) return 'bg-green-50 text-green-700 border-green-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const getRoleBadgeClass = (role: string) => {
    if (role?.startsWith('Trưởng ban')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (role?.startsWith('Thành viên')) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
      { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Filter members (ẩn thành viên chỉ có vai trò Người dùng — không hiện trong tab Thành viên CLB)
  const filteredMembers = members.filter(member => {
    const memberPerm = getPermissionFromMember(member.department || '', member.role || '')
    if (memberPerm === 'user') return false
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.userId.includes(searchQuery)
    const matchesPermission = filterPermission === 'all' || memberPerm === filterPermission
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.status === 'active') ||
                         (filterStatus === 'inactive' && member.status === 'inactive')
    
    return matchesSearch && matchesPermission && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  const handleExportExcel = () => {
    const escapeCsv = (v: string | number) => {
      const s = String(v ?? '')
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    if (activeTab === 'members') {
      const headers = ['ID', 'Họ tên', 'Mã thành viên', 'Ban', 'Vai trò', 'Ngày tham gia', 'Trạng thái']
      const rows = filteredMembers.map(m => [
        m.id,
        m.name,
        m.userId,
        m.department || '',
        m.role || '',
        m.joinDate || '',
        m.status === 'active' ? 'Hoạt động' : 'Tạm khóa'
      ])
      const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `thanh-vien-clb-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const filteredAccounts = accounts.filter(a =>
        a.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const headers = ['ID', 'Họ tên', 'Email', 'Phương thức', 'Phân quyền', 'Lần đăng nhập cuối', 'Ngày tạo']
      const permLabels: Record<string, string> = {
        admin: 'Quản trị viên',
        chairperson: 'Chủ nhiệm',
        vice_chairperson: 'Phó chủ nhiệm',
        head_book: 'Trưởng ban Quản Lý Sách',
        vice_head_book: 'Phó ban Quản Lý Sách',
        head_communication: 'Trưởng ban Truyền thông - Đối Ngoại',
        vice_head_communication: 'Phó ban Truyền thông - Đối Ngoại',
        head_hr_finance: 'Trưởng ban Nhân sự - Tài Chính',
        vice_head_hr_finance: 'Phó ban Nhân sự - Tài Chính',
        member_book: 'Thành viên ban Quản lý sách',
        member_communication: 'Thành viên ban Truyền thông - Đối Ngoại',
        member_hr_finance: 'Thành viên ban Nhân sự - Tài Chính',
        user: 'Người dùng'
      }
      const rows = filteredAccounts.map(a => [
        a.id,
        a.fullName || '',
        a.email || '',
        a.provider === 'google' ? 'Google' : a.provider || 'Email',
        permLabels[a.clubPermission || ''] || a.clubPermission || '',
        a.lastLoginAt || '-',
        a.createdAt || '-'
      ])
      const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tai-khoan-dang-nhap-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          {/* Header */}
          <header className="px-4 md:px-6 lg:px-8 pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Quản lý Thành viên
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Theo dõi, cấp quyền và quản lý thông tin thành viên CLB.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleExportExcel}
                className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span className="truncate">Xuất Excel</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="truncate">Tạo thành viên mới</span>
              </button>
            </div>
          </header>
          
          <div className="p-4 md:p-6 lg:px-8 lg:py-8">
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}
            <div className="flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tổng thành viên</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.total}</h3>
                  <p className="text-xs text-slate-500 mt-1">Chưa có dữ liệu</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <span className="material-symbols-outlined">group</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Thành viên mới</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.newThisMonth}</h3>
                  <p className="text-xs text-slate-500 mt-1">Trong tháng này</p>
                </div>
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Hoạt động tích cực</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.active}</h3>
                  <p className="text-xs text-slate-500 mt-1">Chưa có dữ liệu</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <span className="material-symbols-outlined">how_to_reg</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tạm khóa</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.inactive}</h3>
                  <p className="text-xs text-slate-500 mt-1">Thành viên tạm dừng</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <span className="material-symbols-outlined">lock</span>
                </div>
              </div>
            </div>

            {/* Members & Accounts Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'members'
                      ? 'text-[#137fec] border-b-2 border-[#137fec] bg-blue-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Thành viên CLB
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'accounts'
                      ? 'text-[#137fec] border-b-2 border-[#137fec] bg-blue-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Tài khoản đăng nhập
                </button>
              </div>
              {/* Filters and Quick Add */}
              <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-slate-50 bg-opacity-50">
                {activeTab === 'members' ? (
                <>
                <div className="flex flex-1 items-center gap-2 max-w-xl">
                  <div className="relative w-full">
                    <input 
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all" 
                      placeholder="Tìm theo tên, mã thành viên..." 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person_search</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <select 
                      className="h-10 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                      value={filterPermission}
                      onChange={(e) => setFilterPermission(e.target.value)}
                    >
                      <option value="all">Tất cả phân quyền</option>
                      {PERMISSION_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                  <div className="relative">
                    <select 
                      className="h-10 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Trạng thái</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Tạm khóa</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                </div>
                </>
                ) : (
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative w-full max-w-xs">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên hoặc email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Table */}
              {activeTab === 'accounts' ? (
                loadingAccounts ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
                  </div>
                ) : (() => {
                  const filteredAccounts = accounts.filter(
                    (a) =>
                      a.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  const formatDate = (iso: string) => {
                    if (!iso) return '-'
                    try {
                      const d = new Date(iso)
                      return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    } catch {
                      return iso
                    }
                  }
                  return filteredAccounts.length === 0 ? (
                    <div className="py-16 text-center">
                      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">manage_accounts</span>
                      <p className="text-slate-500 font-medium mb-2">Chưa có tài khoản nào</p>
                      <p className="text-sm text-slate-400">Các tài khoản xuất hiện khi có người đăng nhập qua Email hoặc Google.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b-2 border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                            <th className="px-5 py-5 min-w-[180px] align-middle">Tài khoản</th>
                            <th className="px-5 py-5 min-w-[180px] align-middle">Email</th>
                            <th className="px-5 py-5 min-w-[100px] align-middle">Phương thức</th>
                            <th className="px-5 py-5 min-w-[160px] align-middle whitespace-nowrap">Phân quyền</th>
                            <th className="px-5 py-5 min-w-[120px] align-middle whitespace-nowrap">Lần đăng nhập cuối</th>
                            <th className="px-5 py-5 min-w-[100px] align-middle whitespace-nowrap">Ngày tạo</th>
                            {canViewActivityLog && <th className="px-5 py-5 min-w-[130px] text-center align-middle whitespace-nowrap">Lịch sử thao tác</th>}
                            {canManageAccounts && <th className="px-5 py-5 min-w-[100px] text-right align-middle">Thao tác</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                          {filteredAccounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-5 py-5 align-middle">
                                <div className="flex items-center gap-3">
                                  {acc.avatarUrl ? (
                                    <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 bg-slate-100 relative shrink-0">
                                      <img
                                        src={acc.avatarUrl}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none'
                                          const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                                          if (fb) fb.style.display = 'flex'
                                        }}
                                      />
                                      <span className="text-slate-600 font-bold text-sm" style={{ display: 'none' }}>{getInitials(acc.fullName || '')}</span>
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                                      {getInitials(acc.fullName || '')}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-slate-900">{acc.fullName || '-'}</div>
                                    <div className="text-xs text-slate-500">ID: {formatBookId(acc.id)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-5 text-slate-600 align-middle">{acc.email || '-'}</td>
                              <td className="px-5 py-5 align-middle">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${acc.provider === 'google' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                  {acc.provider === 'google' ? 'Google' : acc.provider === 'email' ? 'Email' : acc.provider}
                                </span>
                              </td>
                              <td className="px-5 py-5 align-middle">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  BAN_CHU_NHIEM.includes(acc.clubPermission || '')
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : ['vice_head_book','vice_head_communication','vice_head_hr_finance'].includes(acc.clubPermission || '')
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : ['member_book','member_communication','member_hr_finance'].includes(acc.clubPermission || '')
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {PERM_LABELS[acc.clubPermission || ''] || acc.clubPermission || 'Người dùng'}
                                </span>
                              </td>
                              <td className="px-5 py-5 text-slate-500 align-middle whitespace-nowrap">{formatDate(acc.lastLoginAt)}</td>
                              <td className="px-5 py-5 text-slate-500 align-middle whitespace-nowrap">{formatDate(acc.createdAt)}</td>
                              {canViewActivityLog && (
                                <td className="px-5 py-5 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={() => openActivityLogModal(acc.email || '', acc.fullName || acc.email || '')}
                                    className="text-primary font-medium text-sm hover:underline"
                                  >
                                    Xem
                                  </button>
                                </td>
                              )}
                              {canManageAccounts && (
                                <td className="px-5 py-5 text-right align-middle">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => openAccountEditModal(acc)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors"
                                      title="Chỉnh sửa phân quyền"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAccount(acc)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Xóa"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
                </div>
              ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-5 py-5 min-w-[200px] align-middle">Thành viên</th>
                      <th className="px-5 py-5 min-w-[160px] align-middle">Ban chuyên môn</th>
                      <th className="px-5 py-5 min-w-[200px] align-middle">Vai trò</th>
                      <th className="px-5 py-5 min-w-[110px] align-middle whitespace-nowrap">Ngày tham gia</th>
                      <th className="px-5 py-5 min-w-[110px] align-middle">Trạng thái</th>
                      {canViewActivityLog && <th className="px-5 py-5 min-w-[130px] text-center align-middle whitespace-nowrap">Lịch sử thao tác</th>}
                      {canManageAccounts && <th className="px-5 py-5 min-w-[100px] text-right align-middle">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {paginatedMembers.map((member) => {
                      const avatarColor = getAvatarColor(member.name)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-5 py-5 align-middle">
                            <div className="flex items-center gap-3">
                              {(member.avatarUrl || member.avatar) ? (
                                <div className={`h-10 w-10 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 relative shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                                  <img
                                    alt={`Avatar ${member.name}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src={(member.avatarUrl || member.avatar) as string}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none'
                                      const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                                      if (fb) fb.style.display = 'flex'
                                    }}
                                  />
                                  <span className="font-bold text-sm shrink-0" style={{ display: 'none' }}>{getInitials(member.name)}</span>
                                </div>
                              ) : (
                                <div className={`h-10 w-10 rounded-full ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-bold text-sm border ${avatarColor.border}`}>
                                  {getInitials(member.name)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{member.name}</div>
                                <div className="text-xs text-slate-500">ID: {member.userId != null && member.userId !== '' ? formatBookId(member.userId) : '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5 text-slate-600 align-middle">{member.department}</td>
                          <td className="px-5 py-5 align-middle min-w-[200px]">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border max-w-full ${getPermissionBadgeClass(getPermissionFromMember(member.department, member.role))}`}>
                              <span className="truncate">{member.role}</span>
                            </span>
                          </td>
                          <td className="px-5 py-5 text-slate-500 align-middle whitespace-nowrap">{member.joinDate}</td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full shrink-0 ${member.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-slate-700">{member.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}</span>
                            </div>
                          </td>
                          {canViewActivityLog && (
                            <td className="px-5 py-5 text-center align-middle">
                              {member.email ? (
                                <button
                                  type="button"
                                  onClick={() => openActivityLogModal(member.email!, member.name)}
                                  className="text-primary font-medium text-sm hover:underline"
                                >
                                  Xem
                                </button>
                              ) : (
                                <span className="text-slate-400 text-sm">—</span>
                              )}
                            </td>
                          )}
                          {canManageAccounts && (
                            <td className="px-5 py-5 text-right align-middle">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenEdit(member)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors" 
                                  title="Chỉnh sửa"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button 
                                  onClick={() => handleDeleteMember(member)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                                  title="Xóa"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 bg-opacity-50">
                <div className="text-sm text-slate-500">
                  Hiển thị <span className="font-semibold text-slate-900">{startIndex + 1}</span> đến{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(startIndex + itemsPerPage, filteredMembers.length)}
                  </span>{' '}
                  trong số <span className="font-semibold text-slate-900">{filteredMembers.length}</span> kết quả
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#137fec] text-white shadow-sm'
                            : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-slate-400 text-sm px-1">...</span>
                  )}
                  {totalPages > 5 && (
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button 
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 transition-colors" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
              </>
              )}
            </div>
          </div>
            </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <button onClick={() => setShowAddModal(true)} className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#137fec] text-white shadow-xl shadow-primary/40 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>

        {/* Modal Chỉnh sửa thành viên */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !submitting && setShowEditModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#137fec]/10 text-[#137fec]">
                    <span className="material-symbols-outlined text-[22px]">person_edit</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Chỉnh sửa thành viên</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin và phân quyền</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setShowEditModal(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
              <form onSubmit={handleUpdateMember} className="flex flex-col gap-4 p-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input type="text" value={formMember.name} onChange={e => setFormMember(p => ({ ...p, name: e.target.value }))} placeholder="Nhập họ tên" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mã thành viên (ID) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formMember.userId ?? ''}
                    onChange={e => setFormMember(p => ({ ...p, userId: e.target.value.trim().replace(/^acc-/, '') }))}
                    placeholder="VD: M001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phân quyền trong CLB</label>
                  <div className="relative" ref={editMemberPermissionDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setEditMemberPermissionDropdownOpen(prev => !prev)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm font-medium text-slate-900 hover:border-[#137fec]/40 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] flex items-center justify-between gap-2 transition-colors"
                    >
                      <span>{PERM_LABELS[formMember.permission] || formMember.permission}</span>
                      <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${editMemberPermissionDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    {editMemberPermissionDropdownOpen && (
                      <div className="absolute z-[100] mt-2 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl max-h-[min(280px,55vh)] overflow-y-auto overflow-x-hidden py-1">
                        <div className="pb-12">
                          {PERMISSION_GROUPS.map(({ groupLabel, options }) => (
                            options.length > 0 && (
                              <div key={groupLabel} className="py-0.5">
                                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 z-[1]">
                                  {groupLabel}
                                </div>
                                {options.map((p) => (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => {
                                      setFormMember(prev => ({ ...prev, permission: p.value }))
                                      setEditMemberPermissionDropdownOpen(false)
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-3 ${formMember.permission === p.value ? 'bg-[#137fec]/10 text-[#137fec] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    <span className="w-6 shrink-0 flex items-center justify-center pt-0.5">
                                      {formMember.permission === p.value ? <span className="material-symbols-outlined text-[18px]">check_circle</span> : null}
                                    </span>
                                    <span className="min-w-0 flex-1 break-words">{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày tham gia</label>
                  <DatePickerButton
                    value={formMember.joinDate}
                    onChange={(v) => setFormMember((p) => ({ ...p, joinDate: v }))}
                    placeholder="Chọn ngày tham gia"
                    className="h-auto py-2.5 rounded-xl border-slate-200 focus:ring-[#137fec]/20 focus:border-[#137fec]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select value={formMember.status} onChange={e => setFormMember(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]">
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm khóa</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2 justify-end border-t border-slate-100 mt-2">
                  <button type="button" onClick={() => !submitting && setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-[#137fec]/25 transition-all">
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">save</span>}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Chỉnh sửa phân quyền tài khoản */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !updatingPermission && setEditingAccount(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#137fec]/10 text-[#137fec]">
                    <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Chỉnh sửa phân quyền</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Cấp quyền truy cập cho tài khoản</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !updatingPermission && setEditingAccount(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="p-6">
                {/* Block tài khoản */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5">
                  {editingAccount.avatarUrl ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
                      <img src={editingAccount.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#137fec]/20 text-[#137fec] flex items-center justify-center font-bold text-lg shrink-0 border-2 border-white shadow-sm">
                      {getInitials(editingAccount.fullName || editingAccount.email || '')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{editingAccount.fullName || 'Chưa có tên'}</p>
                    <p className="text-sm text-slate-500 truncate">{editingAccount.email || '-'}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveAccountPermission} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phân quyền trong CLB</label>
                    <div className="relative" ref={accountPermissionDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setAccountPermissionDropdownOpen(prev => !prev)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm font-medium text-slate-900 hover:border-[#137fec]/40 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] flex items-center justify-between gap-2 transition-colors"
                      >
                        <span>{PERM_LABELS[accountEditPermission] || accountEditPermission}</span>
                        <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${accountPermissionDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>
                      {accountPermissionDropdownOpen && (
                        <div className="absolute z-[100] mt-2 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl max-h-[min(280px,55vh)] overflow-y-auto overflow-x-hidden py-1">
                          <div className="pb-30">
                          {PERMISSION_GROUPS.map(({ groupLabel, options }) => (
                            options.length > 0 && (
                              <div key={groupLabel} className="py-0.5">
                                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 z-[1]">
                                  {groupLabel}
                                </div>
                                {options.map((p) => (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => {
                                      setAccountEditPermission(p.value)
                                      setAccountPermissionDropdownOpen(false)
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-3 ${accountEditPermission === p.value ? 'bg-[#137fec]/10 text-[#137fec] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    <span className="w-6 shrink-0 flex items-center justify-center pt-0.5">
                                      {accountEditPermission === p.value ? <span className="material-symbols-outlined text-[18px]">check_circle</span> : null}
                                    </span>
                                    <span className="min-w-0 flex-1 break-words">{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            )
                          ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 justify-end border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => !updatingPermission && setEditingAccount(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updatingPermission}
                      className="px-6 py-2.5 rounded-xl bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-[#137fec]/25 transition-all"
                    >
                      {updatingPermission ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">save</span>}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tạo thành viên */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !submitting && setShowAddModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#137fec]/10 text-[#137fec]">
                    <span className="material-symbols-outlined text-[22px]">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tạo thành viên mới</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Thêm thành viên và cấp quyền trong CLB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !submitting && setShowAddModal(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateMember} className="flex flex-col gap-4 p-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formMember.name}
                    onChange={e => setFormMember(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nhập họ tên"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mã thành viên (ID) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formMember.userId}
                    onChange={e => setFormMember(p => ({ ...p, userId: e.target.value }))}
                    placeholder="VD: M001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phân quyền trong CLB</label>
                  <div className="relative" ref={addMemberPermissionDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setAddMemberPermissionDropdownOpen(prev => !prev)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-left text-sm font-medium text-slate-900 hover:border-[#137fec]/40 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] flex items-center justify-between gap-2 transition-colors"
                    >
                      <span>{PERM_LABELS[formMember.permission] || formMember.permission}</span>
                      <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 ${addMemberPermissionDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    {addMemberPermissionDropdownOpen && (
                      <div className="absolute z-[100] mt-2 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl max-h-[min(280px,55vh)] overflow-y-auto overflow-x-hidden py-1">
                        <div className="pb-12">
                          {PERMISSION_GROUPS.map(({ groupLabel, options }) => (
                            options.length > 0 && (
                              <div key={groupLabel} className="py-0.5">
                                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/80 sticky top-0 z-[1]">
                                  {groupLabel}
                                </div>
                                {options.map((p) => (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => {
                                      setFormMember(prev => ({ ...prev, permission: p.value }))
                                      setAddMemberPermissionDropdownOpen(false)
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-3 ${formMember.permission === p.value ? 'bg-[#137fec]/10 text-[#137fec] font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                  >
                                    <span className="w-6 shrink-0 flex items-center justify-center pt-0.5">
                                      {formMember.permission === p.value ? <span className="material-symbols-outlined text-[18px]">check_circle</span> : null}
                                    </span>
                                    <span className="min-w-0 flex-1 break-words">{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formMember.status}
                    onChange={e => setFormMember(p => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec]"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm khóa</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2 justify-end border-t border-slate-100 mt-2">
                  <button type="button" onClick={() => !submitting && setShowAddModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[#137fec] hover:bg-[#0f6fd6] text-white font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-[#137fec]/25 transition-all">
                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">add</span>}
                    Tạo thành viên
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Modal Lịch sử thao tác (từ Thành viên CLB / Tài khoản đăng nhập) */}
      {logModalEmail != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeActivityLogModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">history_edu</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Lịch sử thao tác</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{logModalLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeActivityLogModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingLogsForModal ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">progress_activity</span>
                  <p className="mt-2 text-sm text-slate-500">Đang tải...</p>
                </div>
              ) : activityLogsForModal.length === 0 ? (
                <p className="py-12 text-center text-slate-500 text-sm">Chưa có log thao tác.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Thời gian</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Thao tác</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activityLogsForModal.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.action}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>{getStatusFromDetails(log.details || '') || '—'}</span>
                              {log.details && (
                                <button type="button" onClick={() => setExpandedLogDetailId(log.id)} className="text-primary font-medium hover:underline">
                                  Xem thêm
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết 1 log (Xem thêm) */}
      {expandedLogDetailId != null && (() => {
        const log = activityLogsForModal.find((l) => l.id === expandedLogDetailId)
        if (!log) return null
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setExpandedLogDetailId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chi tiết thao tác</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Xem nội dung đầy đủ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedLogDetailId(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Đóng"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Thời gian</p>
                    <p className="text-sm font-medium text-slate-900">{new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-symbols-outlined text-primary text-[20px]">touch_app</span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Thao tác</p>
                    <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Chi tiết
                  </p>
                  <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words">{log.details || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

          </main>
        </div>
  )
}
