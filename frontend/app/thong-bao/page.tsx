'use client'

import { useState } from 'react'
import Sidebar from '../components/Sidebar'

type Notification = {
  id: number
  title: string
  summary: string
  audience: string
  scheduledDate: string
  status: 'sent' | 'scheduled' | 'draft'
  type: 'internal' | 'public'
}

const notifications: Notification[] = [
  {
    id: 1,
    title: 'Họp định kỳ tháng 10',
    summary: 'Tổng kết hoạt động tháng 9 và kế hoạch tháng 10',
    audience: 'Ban chủ nhiệm',
    scheduledDate: '25/10/2023 - 08:00',
    status: 'sent',
    type: 'internal'
  },
  {
    id: 2,
    title: 'Tuyển thành viên Gen 10',
    summary: 'Thông báo mở đơn đăng ký tuyển thành viên mới',
    audience: 'Tất cả',
    scheduledDate: '01/11/2023 - 20:00',
    status: 'scheduled',
    type: 'public'
  },
  {
    id: 3,
    title: 'Nhắc nhở trả sách quá hạn',
    summary: 'Gửi email tự động cho các thành viên mượn sách quá hạn',
    audience: 'Thành viên',
    scheduledDate: '30/10/2023 - 09:00',
    status: 'draft',
    type: 'public'
  },
  {
    id: 4,
    title: 'Thay đổi lịch trực',
    summary: 'Cập nhật bảng phân công lịch trực tuần tới',
    audience: 'Ban chuyên môn',
    scheduledDate: '26/10/2023 - 14:00',
    status: 'sent',
    type: 'internal'
  }
]

export default function ThongBaoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

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

  const getStatusLabel = (status: Notification['status']) => {
    const labels = {
      sent: { text: 'Đã gửi', color: 'text-green-700', bg: 'bg-green-500' },
      scheduled: { text: 'Lên lịch', color: 'text-orange-700', bg: 'bg-orange-500' },
      draft: { text: 'Nháp', color: 'text-gray-700', bg: 'bg-gray-400' }
    }
    return labels[status]
  }

  const getTypeLabel = (type: Notification['type']) => {
    return type === 'internal' 
      ? { text: 'Nội bộ', color: 'bg-blue-50 text-blue-700 border-blue-100' }
      : { text: 'Công khai', color: 'bg-purple-50 text-purple-700 border-purple-100' }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 text-slate-900 font-display overflow-hidden h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcfcfd] relative">
        <div className="flex-1 overflow-y-auto">
          <div className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 lg:py-8 w-full">
            {/* Header */}
            <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
              <div className="flex flex-col gap-2">
                <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Quản lý Thông báo
                </h1>
                <p className="text-slate-500 text-base font-normal leading-normal">
                  Tạo, chỉnh sửa và theo dõi các thông báo nội bộ và công khai cho thành viên.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span className="truncate">Tạo thông báo mới</span>
                </button>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 size-12 shrink-0">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-slate-500 text-sm font-medium">Tổng thông báo</p>
                  <h3 className="text-slate-900 text-2xl font-bold">{totalCount}</h3>
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
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[35%]">Tiêu đề thông báo</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[15%]">Loại</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[15%]">Đối tượng</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[20%]">Ngày lên lịch</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-xs font-bold uppercase tracking-widest w-[15%]">Trạng thái</th>
                      <th className="px-6 py-4 text-right w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredNotifications.map(notification => {
                      const statusMeta = getStatusLabel(notification.status)
                      const typeMeta = getTypeLabel(notification.type)
                      return (
                        <tr key={notification.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-900 text-sm font-semibold">{notification.title}</span>
                              <span className="text-slate-500 text-xs mt-1 truncate max-w-[250px]">{notification.summary}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${typeMeta.color}`}>
                              {typeMeta.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm font-medium">{notification.audience}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{notification.scheduledDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full ${statusMeta.bg}`}></div>
                              <span className={`text-sm font-bold ${statusMeta.color}`}>{statusMeta.text}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors">
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

            {/* Create Form */}
            {showCreateForm && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg mb-20">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Soạn thảo Thông báo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Vui lòng điền đầy đủ các thông tin cần thiết</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Tiêu đề thông báo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Thông báo họp định kỳ tuần 45..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Phạm vi thông báo</label>
                    <div className="flex gap-4">
                      <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/30 transition-all flex-1">
                        <input type="radio" name="type" defaultChecked className="w-5 h-5 text-primary focus:ring-primary" />
                        <span className="ml-3 text-sm font-semibold">Nội bộ CLB</span>
                      </label>
                      <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-purple-50/30 transition-all flex-1">
                        <input type="radio" name="type" className="w-5 h-5 text-primary focus:ring-primary" />
                        <span className="ml-3 text-sm font-semibold">Công khai</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Đối tượng nhận tin</label>
                    <div className="relative">
                      <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none transition-all">
                        <option>Ban chủ nhiệm</option>
                        <option>Ban truyền thông</option>
                        <option>Ban hậu cần</option>
                        <option>Ban chuyên môn</option>
                        <option>Tất cả thành viên</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-2">Nội dung chi tiết</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-200">
                        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors">
                          <span className="material-symbols-outlined text-[20px]">format_bold</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors">
                          <span className="material-symbols-outlined text-[20px]">format_italic</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors">
                          <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                        </button>
                        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors">
                          <span className="material-symbols-outlined text-[20px]">link</span>
                        </button>
                      </div>
                      <textarea
                        placeholder="Nhập nội dung chi tiết của thông báo..."
                        className="w-full border-none bg-white px-4 py-3 focus:ring-0 resize-none min-h-[160px]"
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-slate-900 mb-3">Thời gian đăng tin</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_today</span>
                        <input
                          type="date"
                          className="w-full pl-11 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">schedule</span>
                        <input
                          type="time"
                          className="w-full pl-11 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
                  <button className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all">
                    Hủy bỏ
                  </button>
                  <button className="px-6 py-3 rounded-xl text-sm font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-all">
                    Lưu vào nháp
                  </button>
                  <button className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#137fec] hover:bg-[#0f6fd6] shadow-md shadow-primary/20 transition-all">
                    Xác nhận & Gửi
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
