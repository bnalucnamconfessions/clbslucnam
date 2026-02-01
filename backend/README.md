# Backend - CLB Thư viện (Django)

API Python (Django + Django REST framework) cho hệ thống thư viện, kết nối MySQL (schema `clbsvhdthptlucnam`).

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

## Cấu hình Email (Quên mật khẩu)

Mặc định email in ra **console** (phù hợp dev). Để gửi email thật khi triển khai, xem **[HUONG-DAN-EMAIL.md](HUONG-DAN-EMAIL.md)** — hướng dẫn chi tiết Gmail, Outlook, Yahoo và SMTP khác.

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

## Endpoints

- `GET /` - Thông tin API
- `GET /health` - Kiểm tra server
- `POST /api/auth/login` - Đăng nhập (body: `{"username":"email@example.com","password":"..."}`)
- `POST /api/auth/google` - Đăng nhập Google (body: `{"credential":"<id_token>"}`). Cần `GOOGLE_CLIENT_ID` trong .env
- `GET /api/dashboard/stats` - Thống kê dashboard
- `GET /api/dashboard/top-readers` - Độc giả tích cực
- `GET /api/dashboard/overdue` - Sách quá hạn chưa trả
