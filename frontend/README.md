# Frontend - CLB Sách Lục Nam

Frontend application được xây dựng với Next.js 14 và React.

## Cấu trúc thư mục

```
frontend/
├── app/                    # Next.js App Router
│   ├── components/         # React components (Sidebar, ThuChiContent, XepHangContent, ...)
│   ├── api/                # API routes (auth/google/callback, qr-image)
│   ├── dang-nhap/          # Đăng nhập / Đăng ký
│   ├── quen-mat-khau/      # Quên mật khẩu
│   ├── dat-lai-mat-khau/   # Đặt lại mật khẩu (qua link email)
│   ├── dashboard/          # Khu vực quản trị (tổng quan, tài chính, xếp hạng, đối tác, quyên góp)
│   ├── ho-so/              # Hồ sơ cá nhân (thông tin, lịch sử mượn, lịch sử thao tác)
│   ├── thanh-vien/         # Thành viên CLB & Tài khoản đăng nhập (phân quyền, lịch sử thao tác)
│   ├── thong-bao/          # Thông báo (kênh, đăng bài, đánh dấu đã đọc)
│   ├── books/              # Kho sách
│   ├── qr/                 # Trang tạo mã QR
│   ├── muon/               # Trang mượn sách
│   ├── tra/                # Trang trả sách
│   ├── doi-tac/            # Trang công khai: Đối tác
│   ├── quyen-gop/          # Trang công khai: Quyên góp
│   ├── xep-hang/           # Trang công khai: Bảng xếp hạng
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── lib/                    # Utilities
│   ├── api.ts              # API base URL
│   ├── activityLog.ts      # Ghi lịch sử thao tác (POST /api/activity-log/create)
│   ├── permissions.ts      # Phân quyền (clubPermission, kênh thông báo, menu)
│   └── refetch.ts          # Refetch khi quay lại tab + polling
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
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

Đã bổ sung và **áp dụng cho tất cả trang** có tải dữ liệu:

- **Refetch khi quay lại tab:** Khi bạn chuyển sang tab khác rồi quay lại, trang tự gọi lại API để lấy dữ liệu mới.
- **Polling nhẹ:** Mỗi trang tự làm mới dữ liệu theo chu kỳ (45–60 giây tùy trang).

Trang đã bật: Dashboard, Thông báo, Kho sách, Mã QR, Mượn sách, Trả sách, Thành viên, Tài chính (Thu Chi), Xếp hạng. Hook dùng chung: `lib/refetch.ts` — `useRefetchOnFocusAndInterval(fetchFn, { intervalMs })`.

## Phân quyền & Lịch sử thao tác

- **Phân quyền:** `lib/permissions.ts` định nghĩa vai trò (Quản trị viên, Chủ nhiệm, Phó chủ nhiệm, Trưởng/Phó ban, Thành viên ban, Người dùng). Menu sidebar và quyền xem/sửa từng trang phụ thuộc `clubPermission` (lưu trong `userInfo` sau đăng nhập).
- **Lịch sử thao tác:** Các thao tác (đăng nhập, cập nhật hồ sơ, thêm/sửa/xóa thông báo, thành viên, thu chi, sách, mượn/trả, QR, …) được ghi qua `lib/activityLog.ts` (POST `/api/activity-log/create`). Xem trong **Hồ sơ → tab Lịch sử thao tác**. Trang **Thành viên** (tab Thành viên CLB / Tài khoản đăng nhập) có cột **Lịch sử thao tác** với nút **Xem** — chỉ hiển thị cho Quản trị viên, Chủ nhiệm, Phó chủ nhiệm, Trưởng/Phó ban Nhân sự - Tài Chính.

## Công nghệ sử dụng

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 18** - UI library

