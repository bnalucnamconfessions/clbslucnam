import Sidebar from '../components/Sidebar'
import QRForm from '../components/QRForm'
import StatsCards from '../components/StatsCards'
import QRCodeTable from '../components/QRCodeTable'

export default function QRPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-row bg-white text-slate-900 font-display overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 lg:py-8 w-full">
        <div className="flex flex-col gap-6 w-full">
          {/* Title and Action Buttons */}
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
            <div className="flex flex-col gap-2">
              <h1 className="text-slate-900 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                Tạo & Quản lý Mã QR Sách
              </h1>
              <p className="text-slate-500 text-base font-normal leading-normal">
                Hệ thống tự động tạo ID 12 chữ số bảo mật cho sách mới.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold tracking-[0.015em] gap-2 transition-all border border-slate-300 shadow-sm leading-none">
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span className="truncate">In danh sách</span>
              </button>
              <button className="flex flex-1 md:flex-none cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] hover:bg-[#0f6fd6] text-white text-sm font-bold tracking-[0.015em] gap-2 transition-all shadow-[0_4px_6px_-1px_rgba(19,127,236,0.2)] leading-none">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="truncate">Tạo hàng loạt</span>
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - QR Form */}
              <div className="xl:col-span-1 flex flex-col gap-6">
                <QRForm />
              </div>

              {/* Right Column - Stats & Table */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                <StatsCards />
                <QRCodeTable />
              </div>
            </div>
        </div>
      </main>
    </div>
  )
}
