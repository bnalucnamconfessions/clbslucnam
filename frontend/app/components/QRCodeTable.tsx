'use client'

export default function QRCodeTable() {
  const qrCodes = [
    {
      id: '893508685123',
      qrImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSnHbNTXrgACBkCqHcf2FVtIVCubQ66RzhqQI4AgvsDr_ihihVj9coanADhiV7Cb9hqPqF4XKUgqUrenxEiXBeqb1PjlZg0m8JkcShfg9ZYAfsaxqPcnKMyYfhq4FGHJSeL1nOhQ35HtRnNJ3jjZRn6FyW2mn2GaxuPV5zBC92BdyBLXdZLNCgtT7Ybh64OdWMg9OCi7BlxoXxu7-UsKuPBxc_3HURMJ-54VcIMH0xzAg7AwVn9WE9lFm9shplyZmk-Q3dswpgmSeW',
      date: '24/10/2023',
      status: 'linked',
      statusText: 'Đã liên kết'
    },
    {
      id: '893606760541',
      qrImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6-rIdKqbWdFDIrNOwKxzQHo6aifjcE7VpjSPIuWUeE_R-0L58GZ-l-EwJrkBdilEvh-gt2FVRgBlV0mPqDVENoDbzxyaJEec0LnbIcliB21zBqKldunXdkvzGRRVg2CXoZ1tbc2BBsRI_Yjvu-BqNDMnpDwCQ0pAEpbkQzbsPsBkwfbUG3oTqkfEYfB8Zan0Op2h2YSdzHPqMu3C0a0IIecZLDBwHRmBy3Bys3bcXI4tyXcS4PWwp1KCkqjxFZj4sTr8ube-O9Y3W',
      date: '24/10/2023',
      status: 'unlinked',
      statusText: 'Chưa liên kết'
    },
    {
      id: '893527860124',
      qrImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFZlDf8c0pdJwWnr2tikh8Oh9nHgrziDfDJHzOPvqQJBWpyPG-fzk9nl-DdMOcv5UJ8CjmKheIkiUy_HjBOzxdXk5LlR26kAggT7VtxFBLmtTVRpQv-e_KlWAJcGh8e-lm-ZpTT2OXIZxxnPXz0tgNxkUaWODc4WhX1Gs00IwDEcEO-zCGbVwnY1IRmPJFe3T56mjz0mFqjoFL-7QKcvVSLCLicecS94mRLUwcvJiZHU8fruAX8GcLRbHkJ3qQ6M1KIlNqpgxIMf_3',
      date: '23/10/2023',
      status: 'linked',
      statusText: 'Đã liên kết'
    },
    {
      id: '893497416289',
      qrImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX8Ydz_VcTBann4GC_71xg1Po3ZLYx-4HYqbNvT790oUZyUfx3vK2dS1pMUFS2vijGe055R_nDze7gvr4cMnVW-22-NLSYMoho_RxY7LutjDcRVsxuLHOXzjlSGZHeWZr7XR9Y1CNDJVHLvRczSjCF7n2CUKnuE4idCq6w1LsTk9nz2lEdTpvWvcIEa5BxTE6ttYYKyJhlM2WV5y8InKutdZcIFApx2W3gleasjaXOuLUGddSKwKIzgG7kQ6uueZ2v6yn2EmvJ6HiF',
      date: '22/10/2023',
      status: 'unlinked',
      statusText: 'Chưa liên kết'
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">Danh sách Mã gần đây</h3>
        <div className="flex gap-2">
          <div className="relative">
            <input 
              className="rounded-lg bg-slate-50 border border-slate-300 pl-3 pr-8 py-2 text-sm w-40 sm:w-64 focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 placeholder:text-slate-400 shadow-sm" 
              placeholder="Tìm theo ID 12 số..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">search</span>
          </div>
          <button className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-primary hover:border-primary hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b-2 border-slate-300">
              <th className="px-6 py-3 w-10">
                <input 
                  className="rounded border-2 border-slate-400 text-primary focus:ring-2 focus:ring-primary bg-white w-4 h-4 cursor-pointer" 
                  type="checkbox"
                />
              </th>
              <th className="px-6 py-3">Mã QR</th>
              <th className="px-6 py-3">ID 12 Chữ số (Bảo mật)</th>
              <th className="px-6 py-3">Ngày tạo</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {qrCodes.map((qr, index) => (
              <tr key={index} className="group hover:bg-slate-50 transition-colors border-b border-slate-100">
                <td className="px-6 py-4">
                  <input 
                    className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" 
                    type="checkbox"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded border border-slate-200 shrink-0 size-10 flex items-center justify-center overflow-hidden">
                      <img 
                        alt="QR" 
                        className="w-full h-full object-contain brightness-100 contrast-100" 
                        src={qr.qrImage}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-lg font-bold text-slate-900">{qr.id}</span>
                    <span className="text-xs text-slate-500 italic mt-0.5">Thông tin chi tiết đã ẩn</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  {qr.date}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    qr.status === 'linked' 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`size-1.5 rounded-full ${
                      qr.status === 'linked' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></span>
                    {qr.statusText}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      className="p-2 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                      title="In Tem"
                    >
                      <span className="material-symbols-outlined text-[20px]">print</span>
                    </button>
                    <button 
                      className="p-2 text-slate-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                      title="Chỉnh sửa"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm hover:shadow" 
                      title="Xoá"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-600 font-medium">Hiển thị 1-4 trên 48</span>
        <div className="flex gap-2">
          <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button className="size-8 flex items-center justify-center rounded-lg bg-[#137fec] text-white">1</button>
          <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">2</button>
          <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">3</button>
          <button className="size-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-primary transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}

