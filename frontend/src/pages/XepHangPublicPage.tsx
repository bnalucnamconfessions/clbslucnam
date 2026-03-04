import PublicHeader from '@/components/PublicHeader'
import XepHangContent from '@/components/XepHangContent'

export default function XepHangPublicPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display">
      <PublicHeader />
      <main className="flex flex-col min-h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white no-scrollbar">
          <XepHangContent />
        </div>
      </main>
    </div>
  )
}
