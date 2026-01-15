'use client'

import { useState } from 'react'
import Sidebar from '../components/Sidebar'

interface Member {
  id: string
  name: string
  userId: string
  avatar?: string
  department: string
  role: string
  joinDate: string
  status: 'active' | 'inactive'
}

export default function ThanhVienPage() {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sample data - replace with actual API call
  const members: Member[] = [
    {
      id: '1',
      name: 'Lê Thị Mai',
      userId: '21004562',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVRv0rBrxeN8tzF3AM8qrD09YztncRCpBdC5DO9VCZt1zDlVFfi1HZIVUY-EGufFu3L4rpQ4WA8Z5JxjvP26x18yXb18Br0yjM-5LUDq_Fc979ts2lm6ty1vs-bRE77knvigcHgOqXbh4SDUGvrn_kjHjEahr3fvyB7EzEKJuWzBw1AY2kC14qpNeoLxc4GTws3Z4FdkbjD9vkXRLLjfce25xRXLuUiqr0QEySG-tfeF-hxSuKKuUrr813Jsf0xNBR25mFoQnUIJFb',
      department: 'Ban Truyền thông',
      role: 'Trưởng ban',
      joinDate: '12/09/2021',
      status: 'active'
    },
    {
      id: '2',
      name: 'Trần Văn Hùng',
      userId: '21003321',
      department: 'Ban Kỹ thuật',
      role: 'Thành viên',
      joinDate: '05/10/2022',
      status: 'active'
    },
    {
      id: '3',
      name: 'Nguyễn Thị Lan',
      userId: '22001198',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnsbeOYAkJ9zgsiRy7z3Zl2uXG6QF30TwVW-S8wP-IszLVRtihXKG_jtcH7dJc8_m2xGt0wPQpyM5DD-ihFfLkQi-sTr4mlv8aiztmrnV6rQpbt7P2RbHHyDbJ9L-Aj_JmKxTVCspXn6DCS617VF6nSABv-wf3RPGprJTLZXc4PHxYOXCb9Rqlgs-BIXkx1fObCgC4bDx7rM8lubBIw6Ek2pRBBWmpnPp6EIDxA-gmF_aleZSbV0FvxSG5QZhToVSgpuUdsS1P8dxF',
      department: 'Ban Nội dung',
      role: 'Cộng tác viên',
      joinDate: '15/01/2023',
      status: 'inactive'
    },
    {
      id: '4',
      name: 'Phạm Khoa',
      userId: '22008892',
      department: 'Ban Kỹ thuật',
      role: 'Thành viên',
      joinDate: '20/02/2023',
      status: 'active'
    },
  ]

  const stats = {
    total: 124,
    newThisMonth: 5,
    active: 98,
    pending: 3
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, id])
    } else {
      setSelectedMembers(selectedMembers.filter(mid => mid !== id))
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Trưởng ban':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Thành viên':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Cộng tác viên':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
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

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.userId.includes(searchQuery)
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment
    const matchesRole = filterRole === 'all' || member.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.status === 'active') ||
                         (filterStatus === 'inactive' && member.status === 'inactive')
    
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white">
          {/* Header */}
          <header className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-6 border-b border-slate-200 flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex flex-col gap-2">
              <h2 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Quản lý Thành viên
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Theo dõi, cấp quyền và quản lý thông tin thành viên CLB.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none">
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span className="truncate">Xuất Excel</span>
              </button>
              <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="truncate">Tạo thành viên mới</span>
              </button>
            </div>
          </header>
          
          <div className="p-4 md:p-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tổng thành viên</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                  <p className="text-xs text-green-600 flex items-center mt-1 gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+12% so với tháng trước</span>
                  </p>
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
                  <h3 className="text-2xl font-bold text-slate-900">{stats.active}</h3>
                  <p className="text-xs text-slate-500 mt-1">79% tổng số thành viên</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <span className="material-symbols-outlined">how_to_reg</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Chờ duyệt</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stats.pending}</h3>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Cần xử lý ngay</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Filters and Quick Add */}
              <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-slate-50 bg-opacity-50">
                <div className="flex flex-1 items-center gap-2 max-w-xl">
                  <div className="relative w-full">
                    <input 
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all" 
                      placeholder="Nhập ID người dùng để thêm nhanh..." 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person_search</span>
                  </div>
                  <button className="h-11 px-5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2">
                    <span>Thêm nhanh</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <select 
                      className="h-10 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                      <option value="all">Tất cả Ban</option>
                      <option value="Ban Truyền thông">Ban Truyền thông</option>
                      <option value="Ban Nội dung">Ban Nội dung</option>
                      <option value="Ban Kỹ thuật">Ban Kỹ thuật</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                  <div className="relative">
                    <select 
                      className="h-10 pl-3 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="all">Tất cả Vai trò</option>
                      <option value="Trưởng ban">Trưởng ban</option>
                      <option value="Thành viên">Thành viên</option>
                      <option value="Cộng tác viên">Cộng tác viên</option>
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
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4 w-12">
                        <input 
                          className="rounded border-slate-300 text-primary focus:ring-primary bg-white" 
                          type="checkbox"
                          checked={selectedMembers.length === paginatedMembers.length && paginatedMembers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th className="p-4">Thành viên</th>
                      <th className="p-4">Ban chuyên môn</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Ngày tham gia</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {paginatedMembers.map((member) => {
                      const avatarColor = getAvatarColor(member.name)
                      return (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4">
                            <input 
                              className="rounded border-slate-300 text-primary focus:ring-primary bg-white" 
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {member.avatar ? (
                                <img 
                                  alt={`Avatar ${member.name}`} 
                                  className="h-10 w-10 rounded-full object-cover border border-slate-200" 
                                  src={member.avatar}
                                />
                              ) : (
                                <div className={`h-10 w-10 rounded-full ${avatarColor.bg} ${avatarColor.text} flex items-center justify-center font-bold text-sm border ${avatarColor.border}`}>
                                  {getInitials(member.name)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{member.name}</div>
                                <div className="text-xs text-slate-500">ID: {member.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">{member.department}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{member.joinDate}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-slate-700">{member.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors" 
                                title="Chỉnh sửa"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                                title="Xóa"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          </td>
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
            </div>
          </div>
            </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <button className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#137fec] text-white shadow-xl shadow-primary/40 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </main>
    </div>
  )
}
