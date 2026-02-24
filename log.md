# Log chỉnh sửa dự án — CLB Sách Lục Nam

File này ghi lại **các thay đổi** trong codebase để người chỉnh sửa (hoặc AI) nắm rõ ngữ cảnh và lịch sử chỉnh sửa khi làm việc với dự án.

---

## Mục đích

- **Ghi nhận** mọi chỉnh sửa đáng kể (tính năng, sửa lỗi, refactor).
- **Giúp** người mới hoặc AI hiểu dự án nhanh hơn qua lịch sử thay đổi.
- **Tham chiếu** khi debug hoặc mở rộng tính năng liên quan.

---

## Cách cập nhật log

Mỗi khi có chỉnh sửa:

1. Thêm một mục trong **Chỉnh sửa gần đây** (dưới đây) với:
   - **Ngày** (YYYY-MM-DD)
   - **File/Module** bị ảnh hưởng
   - **Mô tả ngắn** thay đổi và lý do (nếu cần)
2. Chỉnh sửa lớn có thể thêm section riêng hoặc ghi rõ trong mô tả.
3. Có thể gộp nhiều thay đổi nhỏ trong một ngày thành một mục.

---

## Tổng quan dự án (để tham chiếu)

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind — thư mục `frontend/`
- **Backend:** Django REST Framework, MySQL — thư mục `backend/`
- **Chức năng chính:** Đăng nhập, Dashboard, Kho sách, Mượn/Trả sách (QR), Thành viên, Thông báo, Thu chi quỹ, Bảng xếp hạng, Nhà tài trợ, Quyên góp, Hồ sơ cá nhân.

Chi tiết: xem [README.md](README.md), [frontend/README.md](frontend/README.md), [backend/README.md](backend/README.md), [docs/PHAN_QUYEN.md](docs/PHAN_QUYEN.md).

---

## Chỉnh sửa gần đây

### 2026-02-25 (tiếp)

- **frontend/app/muon/page.tsx**
  - Trường **Lớp** cho mượn khách: bỏ dropdown "Chọn lớp" và ô "Hoặc nhập lớp tùy chỉnh", chỉ còn **một ô nhập text** "Nhập lớp..." (nhập như lúc đầu). Gửi API dùng `manualInfo.className`.
  - Nhãn: "Lớp (ghi chú)" → **"Lớp"**; "Mã tài khoản (12 số)" → **"ID tài khoản (12 số)"**.

- **frontend/app/thanh-vien/page.tsx**
  - Tab **Thành viên CLB**: ẩn thành viên chỉ có vai trò "Người dùng" (chỉ hiện thành viên có quyền). Thống kê (tổng, active, inactive) chỉ tính thành viên có vai trò.
  - Sau khi **cập nhật thành viên** (sửa quyền), gọi `fetchAccounts()` để tab "Tài khoản đăng nhập" cập nhật ngay.
  - Cột ID: hiển thị **12 chữ số** (dùng `formatBookId`) cho bảng Tài khoản và bảng Thành viên.
  - Avatar/initials: dùng **getInitials** (2 chữ, từ `lib/initials.ts`) thống nhất cho bảng Thành viên, bảng Tài khoản và modal sửa quyền.

- **frontend/lib/initials.ts** (mới)
  - Hàm `getInitials(name)` — luôn 2 ký tự (hoặc "—"), dùng chung cho Thành viên, Tài khoản, Hồ sơ.

- **Backend API**
  - **auth_me**: response thêm `avatarUrl`, `accountId`.
  - **login** (email/mật khẩu): response thêm `accountId`.
  - **google_auth_callback**: get_or_create Account, cập nhật last_login_at; redirect về frontend kèm **accountId** trong query.

- **frontend/app/ho-so/page.tsx**
  - Header: thêm dòng **ID tài khoản** (12 số, dùng `formatBookId(accountId)`); luôn hiển thị (khi chưa có thì "—").
  - State `accountId`: lấy từ userInfo hoặc parse token "email-{id}"; **chỉ set khi có giá trị** (không set null) để tránh ID nháy rồi mất khi loadUserFromStorage chạy lại.
  - Sync auth/me: dùng `getApiAuth()`, khi thành công gọi `setAccountId(resolvedId)` trực tiếp; catch fallback parse token email-{id}.
  - Avatar/initials: dùng `getInitials`; ưu tiên avatar từ API (userInfo.avatar) khi load hồ sơ.
  - **Modal "Tạo mã QR"**: đổi thành **Mã QR ID tài khoản** — nội dung QR là ID 12 số; dưới QR hiển thị "Tên tài khoản" + tên, dòng nhỏ "ID: 000000000002"; nút Tải về tên file `QR-ID-tai-khoan-{id}.png`. (Có thể còn instrumentation debug tạm thời trong file.)

- **frontend/app/dang-nhap/page.tsx**
  - Khi có token từ URL (Google callback): đọc **accountId** từ query, lưu vào userInfo.
  - handleLogin (email): lưu **data.accountId** vào userInfo khi API trả về.

- **frontend/app/components/RequireAuth.tsx**
  - Khi xử lý token từ URL params: đọc **accountId** từ query, lưu vào userInfo.

- **frontend/app/components/Sidebar.tsx**
  - Khi sync auth/me và ghi lại userInfo: merge **accountId** từ `data.accountId` hoặc `parsed.accountId` vào object trước khi setItem, tránh ghi đè mất accountId.

- **log.md** (file này): Cập nhật mục chỉnh sửa 2026-02-25.

### 2026-02-25

- **frontend/app/muon/page.tsx**
  - **Trường "Lớp (ghi chú)"** cho người mượn khách (nhập thủ công):
    - Đổi từ ô nhập text tự do sang **dropdown chọn từng lớp**.
    - Danh sách lớp mặc định: 10A1, 10A2, 10A3, 11A1, 11A2, 11A3, 12A1, 12A2, 12A3.
    - Thêm option **"Khác (nhập tùy chỉnh)"**: khi chọn sẽ hiện ô nhập text để ghi lớp tùy ý.
    - State mới: `classSelect` — giá trị dropdown; khi "Khác" thì gửi API dùng `manualInfo.className`.
    - Reset `classSelect` khi chuyển mode (QR / Nhập thủ công) và sau khi xác nhận mượn thành công.
  - **log.md** (file này): Thêm file log chỉnh sửa dự án và hướng dẫn cập nhật.

### 2026-02-24 (và trước)

- **backend/api/**
  - Migration **0021**: Thêm trường `BorrowRecord.recorded_by` (FK Account, nullable) — ghi nhận tài khoản tạo phiếu mượn.
  - Migration **0022**: Thêm `guest_name`, `guest_class` cho mượn khách; `member` thành optional (null khi khách).
- **frontend:** Các thay đổi ở `books/page.tsx`, `dashboard/page.tsx`, `muon/page.tsx`, `tra/page.tsx`, `thong-bao/page.tsx`, component `QRCodeTable.tsx`, lib `bookId.ts` (theo git status).
- **backend:** `models.py`, `views.py` — hỗ trợ mượn khách (guest_name, guest_class), recorded_by, return notes.

---

## Ghi chú kỹ thuật (tự thêm khi cần)

- **API mượn sách (guest):** POST `/api/borrow/create` với `guestName`, `guestClass` (optional); không gửi `memberId`.
- **Lớp (guest_class):** Backend lưu tối đa 255 ký tự; frontend trang mượn dùng **một ô nhập text** "Nhập lớp..." cho khách.
- **ID tài khoản (12 số):** Format thống nhất bằng `formatBookId(id)` (lib/bookId.ts). Lưu trong userInfo khi đăng nhập (login response, Google callback redirect, RequireAuth/dang-nhap). auth_me và Sidebar sync cần merge accountId vào userInfo.
- **Initials avatar:** `getInitials(name)` trong `lib/initials.ts` — luôn 2 ký tự, dùng cho Thành viên, Tài khoản, Hồ sơ.
- **Modal QR Hồ sơ:** Nội dung QR = ID tài khoản 12 số; chữ hiển thị = tên tài khoản + dòng "ID: xxx".

---

*Cập nhật lần cuối: 2026-02-25*
