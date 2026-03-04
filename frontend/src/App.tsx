import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'

import HomePage from './pages/HomePage'
import DangNhapPage from './pages/DangNhapPage'
import QuenMatKhauPage from './pages/QuenMatKhauPage'
import DatLaiMatKhauPage from './pages/DatLaiMatKhauPage'
import DashboardPage from './pages/DashboardPage'
import BooksPage from './pages/BooksPage'
import MuonPage from './pages/MuonPage'
import TraPage from './pages/TraPage'
import ThanhVienPage from './pages/ThanhVienPage'
import ThongBaoPage from './pages/ThongBaoPage'
import HoSoPage from './pages/HoSoPage'
import QRPage from './pages/QRPage'
import TaiChinhPage from './pages/TaiChinhPage'
import XepHangDashboardPage from './pages/XepHangDashboardPage'
import DoiTacDashboardPage from './pages/DoiTacDashboardPage'
import QuyenGopDashboardPage from './pages/QuyenGopDashboardPage'
import CaiDatPage from './pages/CaiDatPage'
import WebsitePage from './pages/WebsitePage'
import QuyTacMuonPage from './pages/QuyTacMuonPage'
import XepHangPublicPage from './pages/XepHangPublicPage'
import DoiTacPublicPage from './pages/DoiTacPublicPage'
import QuyenGopPublicPage from './pages/QuyenGopPublicPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dang-nhap" element={<DangNhapPage />} />
      <Route path="/quen-mat-khau" element={<QuenMatKhauPage />} />
      <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhauPage />} />
      <Route path="/xep-hang" element={<XepHangPublicPage />} />
      <Route path="/doi-tac" element={<DoiTacPublicPage />} />
      <Route path="/quyen-gop" element={<QuyenGopPublicPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/tai-chinh"
        element={
          <RequireAuth>
            <TaiChinhPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/xep-hang"
        element={
          <RequireAuth>
            <XepHangDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/doi-tac"
        element={
          <RequireAuth>
            <DoiTacDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/quyen-gop"
        element={
          <RequireAuth>
            <QuyenGopDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/cai-dat"
        element={
          <RequireAuth>
            <CaiDatPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/cai-dat/website"
        element={
          <RequireAuth>
            <WebsitePage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/cai-dat/quy-tac-muon"
        element={
          <RequireAuth>
            <QuyTacMuonPage />
          </RequireAuth>
        }
      />
      <Route
        path="/books"
        element={
          <RequireAuth>
            <BooksPage />
          </RequireAuth>
        }
      />
      <Route
        path="/muon"
        element={
          <RequireAuth>
            <MuonPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tra"
        element={
          <RequireAuth>
            <TraPage />
          </RequireAuth>
        }
      />
      <Route
        path="/thanh-vien"
        element={
          <RequireAuth>
            <ThanhVienPage />
          </RequireAuth>
        }
      />
      <Route
        path="/thong-bao"
        element={
          <RequireAuth>
            <ThongBaoPage />
          </RequireAuth>
        }
      />
      <Route
        path="/ho-so"
        element={
          <RequireAuth>
            <HoSoPage />
          </RequireAuth>
        }
      />
      <Route
        path="/qr"
        element={
          <RequireAuth>
            <QRPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
