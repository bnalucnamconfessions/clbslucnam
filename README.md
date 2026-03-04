# CLB Sách Lục Nam

Hệ thống quản lý thư viện và hoạt động **Câu lạc bộ Sách và Hành động THPT Lục Nam** (BnA Lục Nam).

## Tổng quan

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind, React Router | Giao diện web, đăng nhập (email + Google), dashboard |
| **Backend** | Django REST Framework, MySQL | API REST |

## Tính năng chính

- **Đăng nhập / Đăng ký:** Email + mật khẩu, Google OAuth, quên mật khẩu
- **Dashboard:** Thống kê tổng quan, sách quá hạn
- **Kho sách & Mượn/Trả:** QR code, quản lý phiếu mượn
- **Thành viên:** Phân quyền theo vai trò (Ban chủ nhiệm, Ban Quản lý sách, Ban Truyền thông, Ban NS-TC)
- **Thông báo:** Gửi theo kênh/đối tượng, đánh dấu đã đọc
- **Thu chi quỹ:** Giao dịch thu/chi, duyệt yêu cầu
- **Bảng xếp hạng:** Top độc giả, quà tặng tháng
- **Nhà tài trợ & Đối tác:** Nội dung trang công khai, chỉnh sửa qua dashboard
- **Quyên góp:** Chiến dịch gây quỹ, form xác nhận chuyển khoản
- **Hồ sơ cá nhân:** Thông tin, lịch sử mượn, lịch sử thao tác

## Cấu trúc dự án

```
clbslucnam/
├── frontend/          # React 18 + Vite (TypeScript, Tailwind, React Router)
├── backend/           # Django API (Python, MySQL)
├── README.md          # File này
└── .gitignore
```

- Chi tiết frontend: [frontend/README.md](frontend/README.md)
- Chi tiết backend: [backend/README.md](backend/README.md)
- Phân quyền và chức năng: [docs/PHAN_QUYEN.md](docs/PHAN_QUYEN.md)

## Chạy nhanh (development)

1. **Backend (API):**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   # Tạo .env với MYSQL_* (xem backend/README.md)
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   # Tạo .env với: VITE_API_URL=http://localhost:8000
   npm run dev
   ```

3. Mở [http://localhost:3000](http://localhost:3000) — đăng nhập và sử dụng (cần backend chạy).

## Yêu cầu hệ thống

- **Node.js** — frontend
- **Python 3** + **MySQL** — backend

Chi tiết cài đặt, cấu hình MySQL, email, seed: [backend/README.md](backend/README.md) và [frontend/README.md](frontend/README.md).
