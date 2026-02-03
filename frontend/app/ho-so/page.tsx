'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import RequireAuth from '../components/RequireAuth'
import { apiUrl, getApiAuth } from '../../lib/api'
import { logActivity } from '../../lib/activityLog'

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  studentId: string
  className: string
  cohort: string
  major: string
  avatar?: string
}

interface ClubInfo {
  role: string
  department: string
  joinDate: string
  points: number
}

/** Ánh xạ quyền → tên ban (đồng bộ với backend PERM_TO_MEMBER) để hiển thị "Ban công tác" đúng. */
const PERM_TO_DEPARTMENT: Record<string, string> = {
  admin: 'Quản trị viên',
  chairperson: 'Ban Chủ nhiệm',
  vice_chairperson: 'Ban Chủ nhiệm',
  head_book: 'Ban Quản lý sách',
  vice_head_book: 'Ban Quản lý sách',
  head_communication: 'Ban Truyền thông - Đối Ngoại',
  vice_head_communication: 'Ban Truyền thông - Đối Ngoại',
  head_hr_finance: 'Ban Nhân sự - Tài Chính',
  vice_head_hr_finance: 'Ban Nhân sự - Tài Chính',
  member_book: 'Ban Quản lý sách',
  member_communication: 'Ban Truyền thông - Đối Ngoại',
  member_hr_finance: 'Ban Nhân sự - Tài Chính',
  user: '—',
}

/** Rút trạng thái từ chuỗi chi tiết (vd. "Nội dung: ... | Trạng thái: Đã xác nhận") */
function getStatusFromDetails(details: string): string | null {
  if (!details?.trim()) return null
  const m = details.match(/Trạng thái:\s*([^|]+)/)
  return m ? m[1].trim() : null
}

export default function HoSoPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'general' | 'activities' | 'history' | 'logs'>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activityLogs, setActivityLogs] = useState<{ id: number; action: string; details: string; createdAt: string }[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    studentId: '',
    className: '',
    cohort: '',
    major: '',
    avatar: ''
  })

  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    role: '',
    department: '',
    joinDate: '',
    points: 0
  })
  const [clubPermission, setClubPermission] = useState<string>('user')
  
  const getProfileKey = (accountEmail: string) => {
    if (!accountEmail) return 'profileInfo'
    return `profileInfo_${accountEmail.replace(/[^a-zA-Z0-9@._-]/g, '_')}`
  }

  const loadUserFromStorage = () => {
    if (typeof window === 'undefined') return
    const savedUserInfo = (() => {
      try {
        const s = localStorage.getItem('userInfo')
        return s ? JSON.parse(s) : {}
      } catch {
        return {}
      }
    })()
    const accountEmail = savedUserInfo.accountEmail || savedUserInfo.email || ''
    const profileKey = getProfileKey(accountEmail)
    const savedProfile = localStorage.getItem(profileKey)

    const adminName = localStorage.getItem('adminName')
    const adminRole = localStorage.getItem('adminRole')
    const adminAvatar = localStorage.getItem('adminAvatar')
    const perm = savedUserInfo.clubPermission || 'user'
    setClubPermission(perm)
    const fullName = savedUserInfo.fullName || adminName || ''
    const email = accountEmail || savedUserInfo.email || ''
    const avatar = savedUserInfo.avatar || adminAvatar || ''
    const role = savedUserInfo.role || adminRole || 'Người dùng'
    const department = PERM_TO_DEPARTMENT[perm] ?? PERM_TO_DEPARTMENT.user
    // joinDate lấy từ userInfo (đồng bộ từ auth/me — cùng nguồn với cột NGÀY THAM GIA ở Thành viên)
    const joinDate = savedUserInfo.joinDate ?? ''

    if (savedProfile) {
      // Đã có hồ sơ lưu theo tài khoản → load toàn bộ
      try {
        const parsed = JSON.parse(savedProfile)
        if (parsed.personalInfo) {
          setPersonalInfo(prev => ({
            ...prev,
            ...parsed.personalInfo,
            fullName: parsed.personalInfo.fullName || fullName,
            email: parsed.personalInfo.email || email,
            avatar: parsed.personalInfo.avatar || avatar,
          }))
        } else {
          setPersonalInfo(prev => ({ ...prev, fullName, email, avatar }))
        }
        // Role, department từ userInfo/permission; joinDate từ auth/me (Member) hoặc profile
        const fromProfile = parsed.clubInfo || {}
        setClubInfo(prev => ({
          ...prev,
          ...fromProfile,
          role,
          department,
          joinDate: joinDate || (fromProfile.joinDate ?? prev.joinDate ?? ''),
          points: fromProfile.points ?? prev.points ?? 0,
        }))
      } catch (e) {
        console.error('Error parsing profile:', e)
        setPersonalInfo(prev => ({ ...prev, fullName, email, avatar }))
        setClubInfo(prev => ({ ...prev, role, department, joinDate }))
      }
    } else {
      // Lần đầu đăng nhập/đăng ký: chỉ email và tên, các trường khác để trống
      setPersonalInfo({
        fullName,
        email,
        phone: '',
        address: '',
        dateOfBirth: '',
        studentId: '',
        className: '',
        cohort: '',
        major: '',
        avatar,
      })
      setClubInfo(prev => ({ ...prev, role, department, joinDate }))
    }
  }
  useEffect(() => {
    loadUserFromStorage()
    window.addEventListener('userInfoUpdated', loadUserFromStorage)
    return () => window.removeEventListener('userInfoUpdated', loadUserFromStorage)
  }, [])

  // Đồng bộ role với backend khi mở Hồ sơ để badge + Thông tin CLB khớp với Sidebar và bảng Tài khoản
  useEffect(() => {
    const syncRoleFromBackend = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
        const s = localStorage.getItem('userInfo')
        // #region agent log
        const _p = s ? (() => { try { return JSON.parse(s) } catch { return {} } })() : {}
        const _em = (_p.accountEmail || _p.email || '').trim()
        fetch('http://127.0.0.1:7243/ingest/11c5d4be-529a-4a0d-a759-627a8c8062e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ho-so:syncRoleFromBackend',message:'Before auth/me',data:{hasS:!!s,hasToken:!!token,hasEmail:!!_em},hypothesisId:'H2,H3',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!s) return
        const parsed = JSON.parse(s)
        const email = (parsed.accountEmail || parsed.email || '').trim()
        if (!token && !email) return
        const url = email ? apiUrl(`/api/auth/me?email=${encodeURIComponent(email)}`) : apiUrl('/api/auth/me')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(url, { credentials: 'include', headers })
        if (!res.ok) return
        const data = await res.json()
        const newRole = data.role || parsed.role || 'Người dùng'
        const newPerm = (data.clubPermission || 'user').toLowerCase()
        const newJoinDate = data.joinDate ?? parsed.joinDate ?? ''
        const updated = { ...parsed, role: newRole, clubPermission: newPerm, fullName: data.fullName || parsed.fullName, joinDate: newJoinDate }
        localStorage.setItem('userInfo', JSON.stringify(updated))
        localStorage.setItem('adminRole', newRole)
        window.dispatchEvent(new Event('userInfoUpdated'))
      } catch (_) {}
    }
    syncRoleFromBackend()
  }, [])

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    const existingUserInfo = (() => {
      try {
        const s = localStorage.getItem('userInfo')
        return s ? JSON.parse(s) : {}
      } catch {
        return {}
      }
    })()
    const accountEmail = existingUserInfo.accountEmail || existingUserInfo.email
    let profileResponseEmail = ''
    if (accountEmail) {
      try {
        const payload = { email: accountEmail, fullName: personalInfo.fullName || existingUserInfo.fullName, displayEmail: (personalInfo.email || "").trim() || existingUserInfo.email || "", avatar: personalInfo.avatar || existingUserInfo.avatar || null }
        const res = await fetch(apiUrl('/api/accounts/profile'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || 'Lỗi cập nhật tài khoản')
        }
        const data = await res.json().catch(() => ({}))
        profileResponseEmail = (data.email || '').trim()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Lỗi cập nhật tài khoản')
        return
      }
    }
    const profileKey = getProfileKey(accountEmail)
    localStorage.setItem(profileKey, JSON.stringify({ personalInfo, clubInfo }))
    const userInfo = {
      ...existingUserInfo,
      fullName: personalInfo.fullName || existingUserInfo.fullName,
      email: personalInfo.email || existingUserInfo.email,
      accountEmail: existingUserInfo.accountEmail || existingUserInfo.email,
      avatar: personalInfo.avatar ?? existingUserInfo.avatar,
      role: clubInfo.role || existingUserInfo.role
    }
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    localStorage.setItem('adminName', personalInfo.fullName || '')
    localStorage.setItem('adminRole', clubInfo.role || '')
    localStorage.setItem('adminAvatar', personalInfo.avatar || '')
    window.dispatchEvent(new Event('userInfoUpdated'))
    setIsEditing(false)
    const details = [personalInfo.fullName && `Tên: ${personalInfo.fullName}`, (personalInfo.email || userInfo.email) && `Email: ${personalInfo.email || userInfo.email}`].filter(Boolean).join(' | ')
    logActivity('Cập nhật hồ sơ cá nhân', details, profileResponseEmail || undefined)
    alert('Đã lưu thông tin thành công!')
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)')
      return
    }
    setUploadingAvatar(true)
    try {
      const { headers, accountEmail } = getApiAuth()
      const form = new FormData()
      form.append('file', file)
      if (accountEmail) form.append('accountEmail', accountEmail)
      const res = await fetch(apiUrl('/api/accounts/upload-avatar'), {
        method: 'POST',
        headers,
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Lỗi tải ảnh')
      }
      const data = await res.json()
      if (data?.url) {
        handleInputChange('avatar', data.url)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi tải ảnh lên')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (activeTab !== 'logs') return
    const email = (() => {
      try {
        const s = localStorage.getItem('userInfo')
        const u = s ? JSON.parse(s) : {}
        return (u.accountEmail || u.email || u.displayEmail || '').trim()
      } catch {
        return ''
      }
    })()
    if (!email) {
      setActivityLogs([])
      setLoadingLogs(false)
      return
    }
    setLoadingLogs(true)
    fetch(apiUrl(`/api/activity-log?email=${encodeURIComponent(email)}&accountEmail=${encodeURIComponent(email)}`))
      .then(async (res) => {
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
      })
      .then((data) => setActivityLogs(data))
      .catch(() => setActivityLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [activeTab])

  const getTabClasses = (tab: string) => {
    const isActive = activeTab === tab
    return `flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap cursor-pointer transition-colors ${
      isActive
        ? 'border-primary text-[#0d141b]'
        : 'border-transparent text-[#4c739a] hover:text-primary'
    }`
  }

  return (
    <RequireAuth>
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          <div className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 lg:py-8 w-full min-w-0">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="rounded-full size-32 shadow-md border-4 border-white overflow-hidden flex items-center justify-center bg-[#137fec] text-white text-4xl font-bold">
                      {personalInfo.avatar && (
                        <img
                          src={personalInfo.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                            const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                            if (fb) fb.style.display = 'flex'
                          }}
                        />
                      )}
                      <span className="flex items-center justify-center w-full h-full" style={{ display: personalInfo.avatar ? 'none' : 'flex' }}>
                        {personalInfo.fullName ? personalInfo.fullName.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                    {isEditing && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-white text-xs font-medium">Đổi ảnh ↓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <h1 className="text-[#0d141b] text-3xl font-bold tracking-tight leading-tight">
                        {personalInfo.fullName}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 shrink-0">
                        {clubInfo.role}
                      </span>
                    </div>
                    {personalInfo.studentId && <p className="text-[#4c739a] text-base mt-1">ID: {personalInfo.studentId}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">stars</span>
                        {clubInfo.points.toLocaleString('vi-VN')} Điểm tích lũy
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none"
                  >
                    {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                  </button>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                    <span className="truncate">Tạo mã QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-[#cfdbe7]">
              <div className="flex gap-8 overflow-x-auto">
                <button onClick={() => setActiveTab('personal')} className={getTabClasses('personal')}>
                  <p className="text-sm font-bold leading-normal tracking-wide">Thông tin cá nhân</p>
                </button>
                <button onClick={() => setActiveTab('general')} className={getTabClasses('general')}>
                  <p className="text-sm font-bold leading-normal tracking-wide">Thông tin chung</p>
                </button>
                <button onClick={() => setActiveTab('activities')} className={getTabClasses('activities')}>
                  <p className="text-sm font-bold leading-normal tracking-wide">Hoạt động & Thành tích</p>
                </button>
                <button onClick={() => setActiveTab('history')} className={getTabClasses('history')}>
                  <p className="text-sm font-bold leading-normal tracking-wide">Lịch sử mượn sách</p>
                </button>
                <button onClick={() => setActiveTab('logs')} className={getTabClasses('logs')}>
                  <p className="text-sm font-bold leading-normal tracking-wide">Lịch sử thao tác</p>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'personal' && (
              <div className="relative z-0">
                <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0d141b]">Thông tin cá nhân</h2>
                    {isEditing && (
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold transition-colors shadow-md shadow-blue-500/20"
                      >
                        Lưu thay đổi
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={personalInfo.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.fullName || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Email <span className="text-red-500">*</span>
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.email || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Avatar URL - only when editing */}
                    {isEditing && (
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-sm font-semibold text-[#0d141b]">Ảnh đại diện</label>
                        <div className="flex gap-3 items-start">
                          <div className="shrink-0 rounded-full size-16 overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                            {personalInfo.avatar ? (
                              <img src={personalInfo.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <span className="text-2xl font-bold text-slate-400">{personalInfo.fullName?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="https://example.com/avatar.jpg"
                                value={personalInfo.avatar || ''}
                                onChange={(e) => handleInputChange('avatar', e.target.value)}
                                className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <label className="shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  className="sr-only"
                                  onChange={handleAvatarFileSelect}
                                  disabled={uploadingAvatar}
                                />
                                {uploadingAvatar ? (
                                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                ) : (
                                  <span className="material-symbols-outlined text-lg">upload_file</span>
                                )}
                                <span>{uploadingAvatar ? 'Đang tải...' : 'Chọn từ máy'}</span>
                              </label>
                            </div>
                            <p className="text-xs text-slate-500">Dán đường dẫn ảnh hoặc chọn file từ máy (JPG, PNG, GIF, WebP).</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Số điện thoại
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={personalInfo.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.phone || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Ngày sinh
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={personalInfo.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Class */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Lớp
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={personalInfo.className}
                          onChange={(e) => handleInputChange('className', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.className || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>

                    {/* Cohort */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Khóa
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={personalInfo.cohort}
                          onChange={(e) => handleInputChange('cohort', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.cohort || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>


                    {/* Address - Full Width */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-sm font-semibold text-[#0d141b]">
                        Địa chỉ
                      </label>
                      {isEditing ? (
                        <textarea
                          value={personalInfo.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          rows={3}
                          className="px-4 py-2.5 rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                      ) : (
                        <p className="px-4 py-2.5 rounded-lg bg-slate-50 text-[#4c739a]">
                          {personalInfo.address || 'Chưa cập nhật'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                {/* Club Info Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#0d141b] mb-4">Thông tin câu lạc bộ</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex gap-4 rounded-xl border border-[#cfdbe7] bg-white p-5 items-start">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">shield_person</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[#0d141b] text-base font-bold">Vai trò</h3>
                        <p className="text-[#4c739a] text-sm">{clubInfo.role || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-xl border border-[#cfdbe7] bg-white p-5 items-start">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">groups</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[#0d141b] text-base font-bold">Ban công tác</h3>
                        <p className="text-[#4c739a] text-sm">{clubInfo.department || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-xl border border-[#cfdbe7] bg-white p-5 items-start">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">calendar_today</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[#0d141b] text-base font-bold">Ngày gia nhập</h3>
                        <p className="text-[#4c739a] text-sm">{clubInfo.joinDate || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Borrowing History — hiển thị dữ liệu thật hoặc empty state */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-[#0d141b]">Lịch sử mượn gần đây</h2>
                      <a className="text-sm font-semibold text-primary hover:underline" href="/tra">Xem tất cả</a>
                    </div>
                    <div className="bg-white rounded-xl border border-[#cfdbe7] overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Tên sách</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Ngày mượn</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdbe7]">
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center text-[#4c739a] text-sm">
                              Chưa có lịch sử mượn. Lịch sử sẽ hiển thị khi bạn có phiếu mượn.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Thành tích — empty state thay data giả */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-[#0d141b] mb-2">Thành tích nổi bật</h2>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-6 bg-white rounded-xl border border-[#cfdbe7] text-center">
                        <div className="w-full flex flex-col items-center gap-2">
                          <div className="size-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-3xl">emoji_events</span>
                          </div>
                          <p className="text-sm font-medium text-[#0d141b]">Chưa có thành tích</p>
                          <p className="text-xs text-[#4c739a]">Thành tích sẽ được cập nhật dựa trên hoạt động của bạn.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6">
                  <h2 className="text-xl font-bold text-[#0d141b] mb-4">Hoạt động & Thành tích</h2>
                  <p className="text-[#4c739a]">Nội dung đang được phát triển...</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6">
                  <h2 className="text-xl font-bold text-[#0d141b] mb-4">Lịch sử mượn sách</h2>
                  <p className="text-[#4c739a]">Nội dung đang được phát triển...</p>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6">
                  <h2 className="text-xl font-bold text-[#0d141b] mb-4">Lịch sử thao tác</h2>
                  <p className="text-sm text-[#4c739a] mb-4">Log thao tác của bạn trong 30 ngày gần nhất.</p>
                  {loadingLogs ? (
                    <div className="py-10 text-center text-[#4c739a]">
                      <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                      <p className="mt-2 text-sm">Đang tải...</p>
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <p className="py-10 text-center text-[#4c739a] text-sm">Chưa có log thao tác.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#cfdbe7]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Thời gian</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Thao tác</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-[#4c739a]">Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdbe7]">
                          {activityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-sm text-[#0d141b] whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('vi-VN')}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-[#0d141b]">{log.action}</td>
                              <td className="px-4 py-3 text-sm text-[#4c739a]">
                                <span className="flex items-center gap-1.5 flex-wrap">
                                  <span>{getStatusFromDetails(log.details || '') || '—'}</span>
                                  {log.details && (
                                    <button type="button" onClick={() => setExpandedLogId(log.id)} className="text-primary font-medium hover:underline">
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
            )}
          </div>
        </div>
      </main>

      {/* Modal chi tiết log thao tác */}
      {expandedLogId != null && (() => {
        const log = activityLogs.find((l) => l.id === expandedLogId)
        if (!log) return null
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setExpandedLogId(null)}
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
                  onClick={() => setExpandedLogId(null)}
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

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#0d141b]">Mã QR Thông Tin Cá Nhân</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-slate-200 shadow-sm">
                <img 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain brightness-100 contrast-100" 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(personalInfo.studentId || personalInfo.fullName || personalInfo.email || 'profile')}&bgcolor=FFFFFF&color=000000`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 mb-1">ID Hồ sơ</p>
                <p className="text-lg font-mono font-bold text-[#0d141b]">{personalInfo.studentId || personalInfo.fullName || personalInfo.email || '—'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const qrData = personalInfo.studentId || personalInfo.fullName || personalInfo.email || 'profile'
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(qrData)}&bgcolor=FFFFFF&color=000000`
                  const link = document.createElement('a')
                  link.href = qrUrl
                  link.download = `QR-${(personalInfo.studentId || personalInfo.fullName || 'profile').replace(/[^a-zA-Z0-9-_]/g, '_')}.png`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải về
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequireAuth>
  )
}
