'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'

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

export default function HoSoPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'general' | 'activities' | 'history'>('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  
  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxFU7ZacUewoYf1iGAJlkUaT1gIpPuzbG9fbquHnXuIJX323oHeG_Ozbp8Ea0f9ekUppKUcvuoAz_hhJUcPXBp8tu_KbE5_Zfm7Nucp8fMm6Zs4TIhHtKoxUIaBKT3DZJS9Zs5LuY7p-zHEO0m-aXoBfu4fXiZfI5xrQ22ZpQymAlVnNnu-tC6B6hZ3erQkLfACDdlLPm-ui4eyRDsWlqe-tt2jwgGefN4ocSeIDXHnxQA7gxSR4fHbzCsIuSbvoFsajFYF07VuuGS'
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    dateOfBirth: '2001-05-15',
    studentId: '202100001234',
    className: 'Kỹ thuật phần mềm',
    cohort: '2021',
    major: 'Công nghệ thông tin',
    avatar: defaultAvatar
  })
  
  // Load user info from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserInfo = localStorage.getItem('userInfo')
      if (savedUserInfo) {
        try {
          const parsed = JSON.parse(savedUserInfo)
          setPersonalInfo(prev => ({
            ...prev,
            fullName: parsed.fullName || prev.fullName,
            avatar: parsed.avatar || prev.avatar
          }))
        } catch (e) {
          console.error('Error parsing user info:', e)
        }
      }
    }
  }, [])

  const [clubInfo] = useState<ClubInfo>({
    role: 'Quản trị viên (QTV)',
    department: 'Quản lý sách (QLS)',
    joinDate: '15/08/2022',
    points: 2450
  })

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving personal info:', personalInfo)
    
    // Save to localStorage for Sidebar
    const userInfo = {
      fullName: personalInfo.fullName,
      avatar: personalInfo.avatar,
      role: clubInfo.role
    }
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    
    // Trigger custom event to update Sidebar (same window)
    window.dispatchEvent(new Event('userInfoUpdated'))
    
    setIsEditing(false)
    // Show success message
    alert('Đã lưu thông tin thành công!')
  }

  const handleCancel = () => {
    // TODO: Reset to original data
    setIsEditing(false)
  }

  const getTabClasses = (tab: string) => {
    const isActive = activeTab === tab
    return `flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap cursor-pointer transition-colors ${
      isActive
        ? 'border-primary text-[#0d141b]'
        : 'border-transparent text-[#4c739a] hover:text-primary'
    }`
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white">
          <div className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 lg:py-8 w-full">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e7edf3] p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 shadow-md border-4 border-white"
                    style={{
                      backgroundImage: personalInfo.avatar ? `url("${personalInfo.avatar}")` : 'none',
                      backgroundColor: personalInfo.avatar ? 'transparent' : '#137fec'
                    }}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <h1 className="text-[#0d141b] text-3xl font-bold tracking-tight leading-tight">
                        {personalInfo.fullName}
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 shrink-0">
                        {clubInfo.role}
                      </span>
                    </div>
                    <p className="text-[#4c739a] text-base mt-1">ID: {personalInfo.studentId}</p>
                    <p className="text-[#4c739a] text-base font-medium">
                      Lớp: {personalInfo.className} | Khóa: {personalInfo.cohort}
                    </p>
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
                  <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none">
                    Phân quyền
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
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'personal' && (
              <div>
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
                          {personalInfo.fullName}
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
                          {personalInfo.email}
                        </p>
                      )}
                    </div>

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
                          {personalInfo.phone}
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
                          {new Date(personalInfo.dateOfBirth).toLocaleDateString('vi-VN')}
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
                          {personalInfo.className}
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
                          {personalInfo.cohort}
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
                          {personalInfo.address}
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
                        <p className="text-[#4c739a] text-sm">{clubInfo.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-xl border border-[#cfdbe7] bg-white p-5 items-start">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">groups</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[#0d141b] text-base font-bold">Ban công tác</h3>
                        <p className="text-[#4c739a] text-sm">{clubInfo.department}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 rounded-xl border border-[#cfdbe7] bg-white p-5 items-start">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">calendar_today</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[#0d141b] text-base font-bold">Ngày gia nhập</h3>
                        <p className="text-[#4c739a] text-sm">{clubInfo.joinDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Borrowing History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-[#0d141b]">Lịch sử mượn gần đây</h2>
                      <a className="text-sm font-semibold text-primary" href="#">Xem tất cả</a>
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
                            <td className="px-4 py-4 text-sm font-medium">Clean Code: A Handbook...</td>
                            <td className="px-4 py-4 text-sm text-[#4c739a]">12/10/2023</td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Đã trả</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-4 text-sm font-medium">The Pragmatic Programmer</td>
                            <td className="px-4 py-4 text-sm text-[#4c739a]">28/10/2023</td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Đang mượn</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-4 text-sm font-medium">Design Patterns</td>
                            <td className="px-4 py-4 text-sm text-[#4c739a]">05/11/2023</td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Chờ lấy</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-[#0d141b] mb-2">Thành tích nổi bật</h2>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#cfdbe7]">
                        <div className="size-12 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-500">
                          <span className="material-symbols-outlined text-3xl">emoji_events</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d141b]">Thành viên tích cực T10</p>
                          <p className="text-xs text-[#4c739a]">Dành cho cá nhân cống hiến...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#cfdbe7]">
                        <div className="size-12 rounded-lg bg-blue-400/20 flex items-center justify-center text-blue-500">
                          <span className="material-symbols-outlined text-3xl">menu_book</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d141b]">Chiến thần đọc sách</p>
                          <p className="text-xs text-[#4c739a]">Mượn trên 50 cuốn sách/năm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#cfdbe7]">
                        <div className="size-12 rounded-lg bg-green-400/20 flex items-center justify-center text-green-500">
                          <span className="material-symbols-outlined text-3xl">volunteer_activism</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d141b]">Đại sứ Lan tỏa</p>
                          <p className="text-xs text-[#4c739a]">Hoạt động truyền thông tích cực</p>
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
          </div>
        </div>
      </main>

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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${personalInfo.studentId}&bgcolor=FFFFFF&color=000000`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 mb-1">ID Hồ sơ</p>
                <p className="text-lg font-mono font-bold text-[#0d141b]">{personalInfo.studentId}</p>
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
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${personalInfo.studentId}&bgcolor=FFFFFF&color=000000`
                  const link = document.createElement('a')
                  link.href = qrUrl
                  link.download = `QR-${personalInfo.studentId}.png`
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
  )
}
