import PublicHeader from '@/components/PublicHeader'
import QuyenGopContent from '@/components/QuyenGopContent'

export default function QuyenGopPublicPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-display flex flex-col">
      <PublicHeader />
      <main className="flex-1 w-full">
        <QuyenGopContent />
      </main>
    </div>
  )
}
