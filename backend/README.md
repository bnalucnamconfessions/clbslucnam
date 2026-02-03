# Backend - CLB Thư viện (Django)

API REST (Django + Django REST Framework) cho hệ thống thư viện và hoạt động CLB, kết nối **MySQL** (schema `clbsvhdthptlucnam`).

## Cấu trúc

```
backend/
├── api/
│   ├── models.py       # DashboardStats, Book, Member, Account, Notification, FundTransaction, DonationCampaign, Donation, ...
│   ├── views.py        # API views
│   ├── urls.py         # URL routing
│   ├── admin.py
│   ├── migrations/
│   └── management/commands/   # seed_dashboard, seed_books_members, dbshell_py, test_email
├── config/
│   ├── settings.py     # Cấu hình Django, MySQL, email
│   └── urls.py
├── manage.py
├── requirements.txt
├── SECURITY.md         # Hướng dẫn bảo mật
└── README.md
```

## MySQL – Lệnh và kết nối

### Kết nối backend tới MySQL

Backend đọc cấu hình từ file **`.env`** trong thư mục `backend/`:

| Biến | Ý nghĩa | Mặc định (nếu không có .env) |
|------|---------|------------------------------|
| `MYSQL_HOST` | Máy chủ MySQL | `127.0.0.1` |
| `MYSQL_PORT` | Cổng | `3306` |
| `MYSQL_USER` | Tên đăng nhập | `root` |
| `MYSQL_PASSWORD` | Mật khẩu | *(bắt buộc điền trong .env)* |
| `MYSQL_DATABASE` | Tên database | `clbsvhdthptlucnam` |

Trong code, Django dùng cấu hình này tại **`config/settings.py`** (khối `DATABASES`), engine `django.db.backends.mysql`, driver thực tế là **PyMySQL** (được patch ở đầu `settings.py`).

### Lệnh MySQL thường dùng

**1. Đăng nhập MySQL (dòng lệnh):**
```bash
mysql -h 127.0.0.1 -P 3306 -u root -p
# Nhập mật khẩu khi được hỏi
```

**2. Tạo database (nếu chưa có):**
```sql
CREATE DATABASE IF NOT EXISTS clbsvhdthptlucnam
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

**3. Chọn database và xem bảng:**
```sql
USE clbsvhdthptlucnam;
SHOW TABLES;
```

**4. Kiểm tra kết nối từ backend:**
```bash
cd backend
venv\Scripts\activate
python manage.py dbshell
# Vào được dòng lệnh MySQL của database đã cấu hình → kết nối OK
```
Thoát `dbshell`: gõ `exit`.

**Nếu lỗi:** `You appear not to have the 'mysql' program installed or on your path` — dùng shell qua PyMySQL (không cần cài MySQL client):
```bash
python manage.py dbshell_py
```
Gõ SQL (kết thúc bằng `;`), `exit` hoặc `quit` để thoát.

## Cài đặt

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Cấu hình MySQL trong file `.env` (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE).

## Cấu hình thêm (`.env`)

| Biến | Ý nghĩa |
|------|---------|
| `FRONTEND_URL` | URL frontend (mặc định `http://localhost:3000`) — dùng cho link reset mật khẩu, OAuth redirect |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth Google (đăng nhập bằng Google) |
| `DEFAULT_FROM_EMAIL`, cấu hình SMTP | Gửi email thật (quên mật khẩu, mã xác thực đăng ký) |

**Email:** Mặc định in ra console (dev). Để gửi email thật, cấu hình SMTP trong `config/settings.py` hoặc xem hướng dẫn Gmail/Outlook/Yahoo.

## Chạy

1. Tạo bảng và áp dụng migrations:

```bash
python manage.py migrate
```

2. (Tùy chọn) Seed dữ liệu mẫu cho dashboard:

```bash
python manage.py seed_dashboard
```

3. Chạy server:

```bash
python manage.py runserver 0.0.0.0:8000
```

- API: http://localhost:8000
- Admin: http://localhost:8000/admin (tạo superuser: `python manage.py createsuperuser`)
- Health: http://localhost:8000/health

## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập email (username, password) |
| GET | `/api/auth/me` | Thông tin user (Authorization: Bearer token) |
| POST | `/api/auth/register` | Gửi mã xác thực đăng ký |
| POST | `/api/auth/register/verify` | Xác thực mã và tạo tài khoản |
| POST | `/api/auth/forgot-password` | Yêu cầu đặt lại mật khẩu |
| POST | `/api/auth/reset-password` | Đặt mật khẩu mới (token) |
| GET | `/api/auth/google/start` | Bắt đầu OAuth Google |
| POST | `/api/auth/google/exchange` | Đổi code lấy token (frontend callback) |

### Dashboard
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/dashboard/stats` | Thống kê tổng quan |
| GET | `/api/dashboard/top-readers` | Độc giả tích cực |
| POST | `/api/dashboard/top-readers/refresh` | Cập nhật bảng xếp hạng |
| GET | `/api/dashboard/ranking-gifts` | Cấu hình quà tặng tháng |
| PATCH | `/api/dashboard/ranking-gifts/update` | Cập nhật quà tặng |
| GET | `/api/dashboard/overdue` | Sách quá hạn |

### Sách, Thành viên, Mượn/Trả
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST | `/api/books`, `/api/books/create`, `/api/books/bulk-create` | Kho sách |
| PUT/DELETE | `/api/books/<id>` | Cập nhật / Xóa sách |
| GET/POST | `/api/members`, `/api/members/create` | Thành viên CLB |
| PUT/DELETE | `/api/members/<id>` | Cập nhật / Xóa thành viên |
| GET | `/api/borrow` | Danh sách phiếu mượn đang mở |
| POST | `/api/borrow/create` | Tạo phiếu mượn |
| POST | `/api/return` | Trả sách |

### Thông báo, Activity log
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST | `/api/notifications`, `/api/notifications/create` | Thông báo |
| PUT/DELETE | `/api/notifications/<id>` | Cập nhật / Xóa |
| POST | `/api/notifications/<id>/read` | Đánh dấu đã đọc |
| GET/POST | `/api/activity-log`, `/api/activity-log/create` | Lịch sử thao tác |

### Tài khoản
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/accounts` | Danh sách tài khoản |
| PUT | `/api/accounts/profile` | Cập nhật hồ sơ |
| POST | `/api/accounts/upload-avatar` | Tải avatar |
| PUT | `/api/accounts/<id>/permission` | Cập nhật quyền |
| DELETE | `/api/accounts/<id>/delete` | Xóa tài khoản |

### Thu chi quỹ
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/fund/stats` | Thống kê thu chi |
| GET/POST | `/api/fund/transactions`, `/api/fund/transactions/create` | Giao dịch |
| GET/PUT | `/api/fund/transactions/<id>` | Chi tiết / Cập nhật |

### Nhà tài trợ & Đối tác
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/doi-tac` | Lấy nội dung trang |
| PATCH | `/api/doi-tac/update` | Cập nhật (BCN, Ban NS-TC) |

### Quyên góp
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/quyen-gop/campaign` | Chiến dịch đang active (công khai) |
| GET | `/api/quyen-gop/campaigns` | Danh sách chiến dịch |
| GET/POST | `/api/quyen-gop/campaign/<id>`, `/api/quyen-gop/campaign/create` | Chi tiết / Tạo |
| PATCH | `/api/quyen-gop/campaign/<id>/update` | Cập nhật chiến dịch |
| GET | `/api/quyen-gop/donations` | Danh sách đóng góp |
| POST | `/api/quyen-gop/donate` | Gửi xác nhận ủng hộ |

### Khác
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Thông tin API |
| GET | `/health` | Health check |
| POST | `/api/upload-image` | Tải ảnh (đối tác, quà tặng) |
