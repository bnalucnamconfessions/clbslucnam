'use client'

const donors = [
  { id: 1, name: 'Nguyễn Văn A', amount: 500000, time: 'Vừa xong', status: 'success' },
  { id: 2, name: 'Ẩn danh', amount: 200000, time: '15 phút trước', status: 'success' },
  { id: 3, name: 'Trần Thị B', amount: 100000, time: '2 giờ trước', status: 'success' },
]

const raised = 13_000_000
const goal = 20_000_000
const percent = Math.round((raised / goal) * 100)
const supportCount = 84

export default function QuyenGopDashboardContent() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đã gây quỹ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(raised)}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mục tiêu</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(goal)}đ
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tiến độ</p>
          <p className="text-2xl font-bold text-[#137fec] mt-1">{percent}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lượt ủng hộ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{supportCount}</p>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Tiến độ chiến dịch tháng 10</h3>
        <div className="w-full bg-slate-100 rounded-full h-3.5">
          <div
            className="h-3.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percent}%`, backgroundColor: "#137fec" }}
          />
        </div>
        <p className="text-slate-500 text-sm mt-2">Còn 12 ngày • Top 1: Nguyễn Văn A</p>
      </div>

      {/* Danh sách đóng góp gần đây */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Đóng góp gần đây</h3>
          <p className="text-slate-500 text-sm">Danh sách người ủng hộ trong khu vực quản trị.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Người ủng hộ</th>
                <th className="px-6 py-4 font-semibold">Số tiền</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {donors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                  <td className="px-6 py-4 font-bold text-[#137fec]">
                    {new Intl.NumberFormat('vi-VN').format(d.amount)}đ
                  </td>
                  <td className="px-6 py-4 text-slate-500">{d.time}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <span className="material-symbols-outlined text-[14px]">check</span> Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-center border-t border-slate-50 bg-slate-50/30">
          <a
            href="/quyen-gop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-[#137fec] hover:underline"
          >
            Xem trang Quyên góp công khai →
          </a>
        </div>
      </div>
    </div>
  )
}
