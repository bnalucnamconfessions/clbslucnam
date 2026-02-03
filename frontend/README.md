# Frontend - CLB Sách Lục Nam

Ứng dụng frontend được xây dựng với **Next.js 14** và **React 18**, kết nối với API Django backend.

## Cấu trúc thư mục

```
frontend/
├── app/                    # Next.js App Router
│   ├── components/         # React components
│   │   ├── DoiTacContent.tsx       # Trang Nhà tài trợ & Đối tác
│   │   ├── FontLoader.tsx          # Tải font Material Symbols
│   │   ├── Header.tsx, PublicHeader.tsx
│   │   ├── QRCodeTable.tsx, QRForm.tsx, QRScanner.tsx
│   │   ├── QuyenGopContent.tsx     # Trang Quyên góp công khai
│   │   ├── QuyenGopDashboardContent.tsx  # Dashboard quản lý quyên góp
│   │   ├── RequireAuth.tsx         # Bảo vệ route, xử lý token OAuth
│   │   ├── Sidebar.tsx             # Menu điều hướng
│   │   ├── StatsCards.tsx
│   │   ├── ThuChiContent.tsx       # Thu chi quỹ
│   │   └── XepHangContent.tsx      # Bảng xếp hạng
│   ├── api/                # API routes (auth/google/callback, qr-image)
│   ├── dang-nhap/          # Đăng nhập / Đăng ký (email + Google)
│   ├── quen-mat-khau/      # Quên mật khẩu
│   ├── dat-lai-mat-khau/   # Đặt lại mật khẩu (qua link email)
│   ├── dashboard/          # Khu vực quản trị
│   │   ├── page.tsx        # Tổng quan
│   │   ├── tai-chinh/      # Thu chi quỹ
│   │   ├── xep-hang/       # Bảng xếp hạng
│   │   ├── doi-tac/        # Nhà tài trợ & Đối tác
│   │   └── quyen-gop/      # Quản lý chiến dịch quyên góp
│   ├── ho-so/              # Hồ sơ cá nhân (thông tin, lịch sử mượn, lịch sử thao tác)
│   ├── thanh-vien/         # Thành viên CLB & Tài khoản (phân quyền)
│   ├── thong-bao/          # Thông báo (kênh, đăng bài, đánh dấu đã đọc)
│   ├── books/              # Kho sách
│   ├── qr/                 # Trang tạo mã QR
│   ├── muon/               # Trang mượn sách
│   ├── tra/                # Trang trả sách
│   ├── doi-tac/            # Trang công khai: Nhà tài trợ & Đối tác
│   ├── quyen-gop/          # Trang công khai: Quyên góp (chiến dịch, form ủng hộ)
│   ├── xep-hang/           # Trang công khai: Bảng xếp hạng
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── api.ts              # API base URL (NEXT_PUBLIC_API_URL)
│   ├── activityLog.ts      # Ghi lịch sử thao tác
│   ├── permissions.ts      # Phân quyền (clubPermission, menu, kênh thông báo)
│   └── refetch.ts          # useRefetchOnFocusAndInterval — refetch khi quay tab + polling
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Liên kết với Backend

Frontend gọi API Django tại `NEXT_PUBLIC_API_URL`. Mặc định: `http://localhost:8000`.

- Tạo file `.env.local` trong thư mục `frontend` (hoặc copy từ `.env.example`):
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```
- Đảm bảo backend Django đang chạy khi dùng đăng nhập, dashboard, sách, thành viên, mượn/trả. Xem mục **Chạy Backend** bên dưới.

### Chạy Backend (Django)

Backend nằm ở thư mục `backend/` (cùng cấp với `frontend/`). Cần chạy backend trước hoặc song song với frontend.

1. **Cài đặt (lần đầu):**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```
   Tạo file `.env` trong `backend/` với: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (xem `backend/README.md`).

2. **Tạo bảng (lần đầu hoặc sau khi đổi model):**
   ```bash
   cd backend
   venv\Scripts\activate
   python manage.py migrate
   ```

3. **Chạy server API:**
   ```bash
   cd backend
   venv\Scripts\activate
   python manage.py runserver 0.0.0.0:8000
   ```
   API: [http://localhost:8000](http://localhost:8000). Health: [http://localhost:8000/health](http://localhost:8000/health).

Chi tiết MySQL, seed dữ liệu, admin: xem **backend/README.md**.

### API endpoints liên quan

- Đăng nhập: `POST /api/auth/login`
- Chiến dịch quyên góp: `GET /api/quyen-gop/campaign`, `GET /api/quyen-gop/donations`, `POST /api/quyen-gop/donate`
- Nhà tài trợ & Đối tác: `GET /api/doi-tac`, `PATCH /api/doi-tac/update`
- Thu chi: `GET /api/fund/stats`, `GET /api/fund/transactions`, …

## Cài đặt

```bash
npm install
```

## Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) (hoặc port Next.js báo, ví dụ 3001) để xem ứng dụng. Đảm bảo backend đang chạy (xem **Chạy Backend** trên) khi dùng đăng nhập và các trang dữ liệu.

**Quan trọng:** Phải mở app qua địa chỉ do Next.js phục vụ (ví dụ `http://localhost:3000`). Không mở file HTML tĩnh (ví dụ `code.html`) hoặc dùng server tĩnh khác — các file như `webpack.js`, `react-refresh.js`, `_app.js`, `main.js` do Next.js tự phục vụ tại `/_next/static/...`.

### Nếu gặp 404 (webpack.js, react-refresh.js, _app.js, main.js)

1. **Chạy đúng lệnh:** Trong thư mục `frontend`, chạy `npm run dev` (không dùng `npm start` khi đang dev trừ khi đã `npm run build` trước).
2. **Mở đúng URL:** Chỉ mở `http://localhost:3000` (hoặc port mà terminal hiển thị). Không mở `file:///...` hay thư mục khác.
3. **Xóa cache trình duyệt:** Ctrl+Shift+Delete → xóa cache, hoặc thử Hard Reload (Ctrl+Shift+R) / cửa sổ ẩn danh.
4. **Tắt tiện ích mở rộng:** Thử tắt tạm extension trình duyệt (chúng đôi khi gây request lỗi).
5. **Chạy lại dev server:** Dừng (Ctrl+C) rồi chạy lại `npm run dev`.

## Build cho production

```bash
npm run build
npm start
```

## Cập nhật dữ liệu (không cần reload trang)

Các trang mạng như Facebook có cảm giác "realtime" vì họ dùng **WebSocket** (server đẩy dữ liệu ngay khi có thay đổi), **polling** (client gọi API định kỳ), hoặc **refetch khi quay lại tab**. Ứng dụng này mặc định chỉ tải dữ liệu **một lần khi mở trang**, nên trước đây phải F5 mới thấy cập nhật.

Đã bổ sung và áp dụng cho các trang có tải dữ liệu:

- **Refetch khi quay lại tab:** Khi chuyển sang tab khác rồi quay lại, trang tự gọi lại API.
- **Polling:** Làm mới dữ liệu mỗi **20 giây** (`intervalMs: 20 * 1000`).

**Trang đã bật:** Dashboard, Thông báo, Kho sách, Mã QR, Mượn sách, Trả sách, Thành viên, Tài chính (Thu Chi), Xếp hạng.

**Hook dùng chung:** `lib/refetch.ts` — `useRefetchOnFocusAndInterval(fetchFn, { intervalMs })`.

## Phân quyền & Lịch sử thao tác

- **Phân quyền:** `lib/permissions.ts` định nghĩa vai trò (Quản trị viên, Chủ nhiệm, Phó chủ nhiệm, Trưởng/Phó ban, Thành viên ban, Người dùng). Menu sidebar và quyền xem/sửa từng trang phụ thuộc `clubPermission` (lưu trong `userInfo` sau đăng nhập).
- **Lịch sử thao tác:** Các thao tác (đăng nhập, cập nhật hồ sơ, thêm/sửa/xóa thông báo, thành viên, thu chi, sách, mượn/trả, QR, …) được ghi qua `lib/activityLog.ts` (POST `/api/activity-log/create`). Xem trong **Hồ sơ → tab Lịch sử thao tác**. Trang **Thành viên** (tab Thành viên CLB / Tài khoản đăng nhập) có cột **Lịch sử thao tác** với nút **Xem** — chỉ hiển thị cho Quản trị viên, Chủ nhiệm, Phó chủ nhiệm, Trưởng/Phó ban Nhân sự - Tài Chính.

## Trang công khai

Các trang **doi-tac**, **quyen-gop**, **xep-hang** có thể xem không cần đăng nhập:

- **Quyên góp** (`/quyen-gop`): Chiến dịch gây quỹ, danh sách người ủng hộ, form xác nhận chuyển khoản — dữ liệu từ API.
- **Nhà tài trợ & Đối tác** (`/doi-tac`): Nội dung từ `DoiTacData`, có thể chỉnh sửa qua dashboard (Ban chủ nhiệm, Ban NS-TC).
- **Bảng xếp hạng** (`/xep-hang`): Top độc giả, quà tặng tháng.

## Công nghệ sử dụng

- **Next.js 14** — App Router
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Material Symbols** — Icons
