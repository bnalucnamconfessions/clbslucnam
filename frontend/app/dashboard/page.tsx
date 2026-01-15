import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardPage() {
  // Get current month and year
  const currentDate = new Date()
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

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
                Dashboard Hoạt động Mượn & Trả Sách
              </h2>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Tổng quan tình hình mượn trả và thành viên tích cực
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-slate-400 text-sm mr-2">calendar_month</span>
                <span className="text-slate-700 text-sm font-medium">{currentMonth}, {currentYear}</span>
              </div>
              <button 
                className="group flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal transition-all duration-200 shadow-lg shadow-blue-500/20 hover:bg-white hover:text-[#137fec] hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px] mr-2 group-hover:text-[#137fec] transition-colors">download</span>
                <span className="truncate">Xuất báo cáo</span>
              </button>
            </div>
          </header>
          
          <div className="p-4 md:p-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-6">
            {/* Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mượn hôm nay */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Mượn hôm nay
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">today</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">12</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +20%
                  </p>
                </div>
              </div>

              {/* Mượn tháng này */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Mượn tháng này
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">calendar_view_month</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">345</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +5%
                  </p>
                </div>
              </div>

              {/* Sách quá hạn */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-red-200 bg-white hover:border-red-300 transition-colors group relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-red-600 text-sm font-medium leading-normal group-hover:text-red-500 transition-colors">
                    Sách quá hạn
                  </p>
                  <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-1.5 rounded-lg">warning</span>
                </div>
                <div className="flex items-end gap-2 relative z-10">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">8</p>
                  <p className="text-red-500 text-sm font-medium mb-1">+2 sách</p>
                </div>
              </div>

              {/* Thành viên hoạt động */}
              <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 bg-white hover:border-primary/50 transition-colors group shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm font-medium leading-normal group-hover:text-primary transition-colors">
                    Thành viên hoạt động
                  </p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">diversity_3</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-slate-900 text-3xl font-bold leading-tight">120</p>
                  <p className="text-green-600 text-sm font-medium mb-1 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +12%
                  </p>
                </div>
              </div>
            </section>

            {/* Chart and Top Readers */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold leading-normal">Xu hướng Mượn & Trả Sách</h3>
                    <p className="text-slate-500 text-sm">Thống kê theo tuần trong tháng</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-md bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium border border-slate-200">
                      Theo ngày
                    </button>
                    <button className="px-3 py-1 rounded-md bg-primary text-white text-xs font-medium">
                      Theo tuần
                    </button>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#137fec]"></div>
                    <span className="text-slate-600 font-medium">Mượn sách</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600 font-medium">Trả sách</span>
                  </div>
                </div>
                <div className="w-full h-[240px] mt-4 relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                    {/* Grid lines */}
                    <line opacity="0.3" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="0" y2="0"></line>
                    <line opacity="0.3" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                    <line opacity="0.3" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                    <line opacity="0.3" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                    
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="borrowGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#137fec" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#137fec" stopOpacity="0"></stop>
                      </linearGradient>
                      <linearGradient id="returnGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    
                    {/* Return area fill */}
                    <path 
                      d="M0,160 C100,150 150,100 200,100 C250,100 300,130 400,110 C500,90 550,40 600,40 C650,40 750,100 800,90 V200 H0 Z" 
                      fill="url(#returnGradient)"
                    ></path>
                    
                    {/* Borrow area fill */}
                    <path 
                      d="M0,150 C100,140 150,80 200,80 C250,80 300,120 400,100 C500,80 550,20 600,20 C650,20 750,90 800,80 V200 H0 Z" 
                      fill="url(#borrowGradient)"
                    ></path>
                    
                    {/* Return line */}
                    <path 
                      d="M0,160 C100,150 150,100 200,100 C250,100 300,130 400,110 C500,90 550,40 600,40 C650,40 750,100 800,90" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="3"
                    ></path>
                    
                    {/* Borrow line */}
                    <path 
                      d="M0,150 C100,140 150,80 200,80 C250,80 300,120 400,100 C500,80 550,20 600,20 C650,20 750,90 800,80" 
                      fill="none" 
                      stroke="#137fec" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="3"
                    ></path>
                    
                    {/* Return data points */}
                    <circle cx="200" cy="100" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2"></circle>
                    <circle cx="400" cy="110" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2"></circle>
                    <circle cx="600" cy="40" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2"></circle>
                    
                    {/* Borrow data points */}
                    <circle cx="200" cy="80" fill="#ffffff" r="4" stroke="#137fec" strokeWidth="2"></circle>
                    <circle cx="400" cy="100" fill="#ffffff" r="4" stroke="#137fec" strokeWidth="2"></circle>
                    <circle cx="600" cy="20" fill="#ffffff" r="4" stroke="#137fec" strokeWidth="2"></circle>
                  </svg>
                  <div className="flex justify-between mt-2 text-slate-400 text-xs font-medium">
                    <span>Tuần 1</span>
                    <span>Tuần 2</span>
                    <span>Tuần 3</span>
                    <span>Tuần 4</span>
                  </div>
                </div>
              </div>

              {/* Top Readers */}
              <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-full shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-slate-900 text-lg font-bold leading-normal">Độc giả tích cực</h3>
                  <p className="text-slate-500 text-sm">Top thành viên mượn nhiều nhất tháng</p>
                </div>
                <div className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto max-h-[340px]">
                  {/* Rank 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                    <div className="relative">
                      <div 
                        className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-yellow-500"
                        style={{
                          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCiiiX0VnCtq_K4LdbpBWSomOgC9FAazLVKpea4FGHGGWm00Pfm6_0ZWjq0P4_VRSHk-963CnL5zelONoHpYOkIXpDvUBmPo_vcPok_C5HUnwvfsW9OWO7ZHXNgUNF-AYD0q8tub7jSJg9Z3N4sAQ1RXJZ6JyNa4X0fwg3Hl0iGHspHDQ7mTB_eCeoDZvNghars3RvPb-RNzNjJQ-IyvlUaAec8oswQF58yIDO5tIhl6xgoY_pr5YeqcJsCEhgT8r8ZlB-8mOUG5sGE")'
                        }}
                      ></div>
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-medium truncate">Nguyễn Văn A</p>
                      <p className="text-primary text-xs font-normal">15 sách</p>
                    </div>
                    <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                  </div>

                  {/* Rank 2 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="relative">
                      <div 
                        className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-gray-400"
                        style={{
                          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDQ2ehwp2vLAOtxeZeXvI06h9WZM8x3KsnyO4uLRkU8L6Cw502S9QabyTdEmjShmVSa0rc_YocmhUQagqBouglexh1RXc3xSa4dct3gyZLC4h9-pNIZyRXYl_1QfGfZgcycVxTQFCEtLzJrXtMbGEmLm81o_PwmiAm7KufvwDn_Qi_61dWwScE7TBielE2s9uY5_s90bY5OsU_IekHu2FsU3ueaJuPNoZltJXLcwjpcPA1BkHkXK5-qZvvJsQbV7X9641DHunwTnm6Z")'
                        }}
                      ></div>
                      <div className="absolute -top-1 -right-1 bg-gray-400 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-medium truncate">Trần Thị B</p>
                      <p className="text-slate-500 text-xs font-normal">12 sách</p>
                    </div>
                  </div>

                  {/* Rank 3 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="relative">
                      <div 
                        className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border-2 border-orange-700"
                        style={{
                          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBoniz2pdB7DfUoljTRzs5EFf40ePhJ-bgO7aLe4BYpzETE0kp_88Toov15Nu31MH-22TP9mG2mELCosehBSiIw-Bv-KuSjZ6Hvu5LcuiWdxkSMVItik-UO17B1OTo7srg0Aa7cLrwbs7ex-dRZmEsxLrLJMmzIMoAERkULs7Hb1pLbpV98Uba-OQWC-vWCfAVm_QICxfTBRJiIgVTBz7yDqFbve9C-dmZLCOLh5XVDeO13MAcx7nmBX0GXmz00BToMKNyd5TfYqTKY")'
                        }}
                      ></div>
                      <div className="absolute -top-1 -right-1 bg-orange-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-medium truncate">Lê Văn C</p>
                      <p className="text-slate-500 text-xs font-normal">10 sách</p>
                    </div>
                  </div>

                  {/* Rank 4 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div 
                      className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border border-slate-200"
                      style={{
                        backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB2b66XogRPVkyghGXOQLFB9qaNbSnkjBfl_Gdv6Uy1fCfj8q637Piz1tu8uqDYX26B7OGzvUoRGt9EAdjp_ZyNVrI0BnYFMDaBIJPfR7qJxiKBGc7Hztb3FObpHgm96FagFRWjbI-VVlZ1xoDnJSwWAbidELRuqzzh3hQgIS5QO2daGEJ04v1UthwujR18lpZ0g5xRMB58l3aNS5t292ubZrVKofqThKXjwN2RFrLmMn6d56c0jaJly3O-MciQU6__cbrmy9hNCXUt")'
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-medium truncate">Phạm D</p>
                      <p className="text-slate-500 text-xs font-normal">8 sách</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Overdue Books Table */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg">priority_high</span>
                  <div>
                    <h3 className="text-slate-900 text-lg font-bold leading-normal">Danh sách quá hạn chưa trả</h3>
                    <p className="text-slate-500 text-sm">Cần gửi thông báo nhắc nhở ngay</p>
                  </div>
                </div>
                <button className="text-sm text-primary font-medium hover:text-blue-400">Xem tất cả</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 font-medium">Tên Sách</th>
                      <th className="p-4 font-medium">Người Mượn</th>
                      <th className="p-4 font-medium">Ngày Hẹn Trả</th>
                      <th className="p-4 font-medium text-center">Số Ngày Quá Hạn</th>
                      <th className="p-4 font-medium text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-10 rounded bg-cover bg-center shadow-sm shrink-0"
                            style={{
                              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD2ijnheccEgaRhY-FMnheqAHS7xBcn6zpGpe3eeCjg9lcN-fwRymjL2rtU5Ta7xa0C2GBBhnPYh1Tj9sudwDzkACj6Ak0B_i_FxsnUCWXMCh_b6wS1744_RQzWkCMuS86RX7yxuGxvVfOc8gnrieiHoYRjJ42zmzP5EZ-ruaBCs1bYorcfQA3ewRzpWEIoO_u8HhG3xqe8cUr61H1iYPnb_iv3Cac_ouh34XgszrTyd3qXejLO-QEE6sdp3pdtwVpYaYJLNpY_e21a")'
                            }}
                          ></div>
                          <span className="font-medium text-slate-900">Clean Code</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-900">Lê Văn C</td>
                      <td className="p-4 text-slate-500">10/10/2023</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                          5 ngày
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-primary text-primary hover:text-white rounded-md transition-all text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">notifications</span>
                          Gửi nhắc nhở
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-10 rounded bg-cover bg-center shadow-sm shrink-0"
                            style={{
                              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC1AV39psNC2LZV3zPf9Roer8xyA-rMcAmXFRCZir6Z1J8of_Gra5bvYt3brilCO9CqWq_UMJ-iZHbmXudQ3K5yqTR1BF7mqYPZtN4_zRt_bsAtgmXXpX8QLNnn8PhPbzkfAvEv7QoapSc4Y_uonOP-7XDFOvKuqNaecfijVXgO4uhGfHQ7_s0S49lGSM2GnggRe0H81mLUghYgB7LWAQAMZjhfSyYPW7EYDn0Ox-sNuJ8rlfyhULjsp9t8_69s19JQnw-R_Ob5RxdY")'
                            }}
                          ></div>
                          <span className="font-medium text-slate-900">Design Patterns</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-900">Phạm Thị E</td>
                      <td className="p-4 text-slate-500">12/10/2023</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                          3 ngày
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-primary text-primary hover:text-white rounded-md transition-all text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">notifications</span>
                          Gửi nhắc nhở
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-10 rounded bg-cover bg-center shadow-sm shrink-0"
                            style={{
                              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCjt_959pTCNtYkMX-AnUI-uBBswRZ0uKTd09N0A8xtL4GbDDsf3fhSsDzUcqdnmAODsXmuO3UbYHVLAYs5oojU39sGntxayLLpbRVSftPbuqf6xYRUmRFAeCEQRxtgahyINGksZBtuZLUHLoxwTfvpFT-rsl_JyU_RTS6ee_6skH1Q-fkGfMxUri7z-OY5l1qB0yBVdr-WAd_wPZIDMMeS9Btw-EKXADNDFpEiOCdSyXjwLO-VrEkK6pUhfacpGBXhReH1xw6QnC7e")'
                            }}
                          ></div>
                          <span className="font-medium text-slate-900">Pragmatic Programmer</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-900">Hoàng Văn F</td>
                      <td className="p-4 text-slate-500">14/10/2023</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600">
                          1 ngày
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-primary text-primary hover:text-white rounded-md transition-all text-xs font-medium">
                          <span className="material-symbols-outlined text-[16px]">notifications</span>
                          Gửi nhắc nhở
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}
