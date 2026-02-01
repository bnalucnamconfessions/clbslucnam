# CLB Sách Lục Nam

Hệ thống quản lý thư viện và hoạt động Câu lạc bộ Sách — gồm **frontend** (Next.js) và **backend** (Django).

## Cấu trúc dự án

```
clbslucnam/
├── frontend/          # Ứng dụng web Next.js 14 (React, TypeScript, Tailwind)
├── backend/           # API Django (Python, MySQL)
├── README.md          # File này
└── .gitignore
```

- **Frontend:** Giao diện người dùng, đăng nhập, dashboard, quản lý sách, thành viên, thông báo, thu chi, xếp hạng, hồ sơ cá nhân, lịch sử thao tác. Chi tiết: [frontend/README.md](frontend/README.md).
- **Backend:** API REST (auth, sách, mượn/trả, thành viên, tài khoản, thông báo, thu chi, activity log). Chi tiết: [backend/README.md](backend/README.md).

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
   # Tùy chọn: .env.local với NEXT_PUBLIC_API_URL=http://localhost:8000
   npm run dev
   ```

3. Mở trình duyệt: [http://localhost:3000](http://localhost:3000). Đăng nhập và dùng app (cần backend chạy ở bước 1).

## Yêu cầu

- **Node.js** (cho frontend)
- **Python 3** + **MySQL** (cho backend)

Chi tiết cài đặt, cấu hình MySQL, email, seed dữ liệu: xem [backend/README.md](backend/README.md) và [frontend/README.md](frontend/README.md).
