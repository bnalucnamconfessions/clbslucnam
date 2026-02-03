# Phân quyền và chức năng theo vai trò

Tài liệu mô tả **tất cả vai trò** và **quyền hạn** tương ứng trong hệ thống CLB Sách và Hành động THPT Lục Nam.

---

## 1. Các vai trò (club_permission)

| Mã quyền | Nhãn hiển thị |
|----------|---------------|
| `admin` | Quản trị viên |
| `chairperson` | Chủ nhiệm |
| `vice_chairperson` | Phó Chủ nhiệm |
| `head_book` | Trưởng ban Quản lý Sách |
| `vice_head_book` | Phó ban Quản lý Sách |
| `member_book` | Thành viên ban Quản lý sách |
| `head_communication` | Trưởng ban Truyền thông - Đối Ngoại |
| `vice_head_communication` | Phó ban Truyền thông - Đối Ngoại |
| `member_communication` | Thành viên ban Truyền thông - Đối Ngoại |
| `head_hr_finance` | Trưởng ban Nhân sự - Tài Chính |
| `vice_head_hr_finance` | Phó ban Nhân sự - Tài Chính |
| `member_hr_finance` | Thành viên ban Nhân sự - Tài Chính |
| `user` | Người dùng |

**Lưu ý:** `qtv` được chuẩn hóa thành `admin`.

---

## 2. Nhóm quyền

### Ban Chủ nhiệm (BCN)
- `admin` (Quản trị viên)
- `chairperson` (Chủ nhiệm)
- `vice_chairperson` (Phó Chủ nhiệm)

### Ban Quản lý Sách
- `head_book`, `vice_head_book`, `member_book`

### Ban Truyền thông - Đối Ngoại
- `head_communication`, `vice_head_communication`, `member_communication`

### Ban Nhân sự - Tài Chính
- `head_hr_finance`, `vice_head_hr_finance`, `member_hr_finance`

---

## 3. Truy cập theo đường dẫn (Route)

### Người dùng (`user`)
Chỉ được vào các trang sau (bị chặn các trang khác, redirect về `/dashboard/xep-hang`):

| Đường dẫn | Mô tả |
|-----------|-------|
| `/dashboard/xep-hang` | Bảng xếp hạng |
| `/dashboard/quyen-gop` | Quyên góp (chỉ xem) |
| `/dashboard/doi-tac` | Nhà tài trợ & Đối tác (chỉ xem) |
| `/ho-so` | Hồ sơ cá nhân |
| `/thong-bao` | Thông báo (chỉ kênh Người dùng) |

**Bị chặn:** `/books`, `/qr`, `/muon`, `/tra`, `/thanh-vien`, `/dashboard` (tổng quan).

### Thành viên có vai trò (không phải `user`)
Được vào tất cả trang trong khu vực quản trị, bao gồm:
- `/dashboard` (Tổng quan)
- `/books`, `/qr`, `/muon`, `/tra` (nếu thuộc menu Kho sách — xem mục 4)
- `/thanh-vien`
- `/dashboard/tai-chinh`
- Các trang công khai và hồ sơ, thông báo

---

## 4. Menu Sidebar

### Menu Kho sách (Kho sách, Mã QR, Mượn sách, Trả sách)
Chỉ hiển thị cho:
- BCN: `admin`, `chairperson`, `vice_chairperson`
- Ban Quản lý Sách: `head_book`, `vice_head_book`, `member_book`

### Menu Tổng quan, Thành viên, Tài chính
Chỉ hiển thị cho thành viên có vai trò (`club_permission !== 'user'`). Người dùng không thấy các mục này.

---

## 5. Quyền theo chức năng

### 5.1. Kho sách (Books, QR, Mượn, Trả)
| Hành động | Quyền |
|-----------|-------|
| Xem danh sách sách | Có menu Kho sách |
| Thêm / Sửa / Xóa sách | Có menu Kho sách |
| Tạo mã QR (bulk) | Có menu Kho sách |
| Mượn sách, Trả sách | Có menu Kho sách |

*Backend hiện chưa kiểm tra quyền; quyền thực tế do Frontend che menu.*

### 5.2. Thành viên (Members)
| Hành động | Quyền |
|-----------|-------|
| Xem danh sách thành viên CLB | Thành viên có vai trò |
| Thêm / Sửa / Xóa thành viên | Thành viên có vai trò |

*Backend chưa kiểm tra quyền.*

### 5.3. Tài khoản đăng nhập (Accounts)
| Hành động | Quyền (Frontend) | Quyền (Backend API) |
|-----------|------------------|---------------------|
| Xem danh sách tài khoản | Thành viên có vai trò | Không kiểm tra |
| Chỉnh sửa quyền (club_permission) | BCN + Ban NS-TC | **Chỉ Ban Chủ nhiệm** |
| Xóa tài khoản | BCN + Ban NS-TC | Không kiểm tra |

**Chỉ Ban Chủ nhiệm** mới gọi được API `PUT /api/accounts/<id>/permission`. Các vai trò khác thấy nút nhưng API sẽ trả 403 nếu gọi.

**Xem lịch sử thao tác** (cột "Lịch sử thao tác"):
- BCN + Trưởng/Phó ban Nhân sự - Tài Chính: `admin`, `chairperson`, `vice_chairperson`, `head_hr_finance`, `vice_head_hr_finance`

### 5.4. Thông báo (Notifications)
| Hành động | Quyền |
|-----------|-------|
| Đăng / Sửa / Xóa thông báo | BCN + Trưởng ban + Phó ban |
| Xem thông báo | Theo kênh (xem bảng Kênh hiển thị) |

**Kênh hiển thị trên sidebar:**

| Vai trò | Kênh hiển thị |
|---------|---------------|
| BCN (admin, chairperson, vice_chairperson) | Tất cả (Quản lý sách, Truyền thông, NS-TC, Ban Chủ nhiệm) |
| Trưởng ban Quản lý Sách | Quản lý sách, Ban Chủ nhiệm |
| Trưởng ban Truyền thông | Truyền thông, Ban Chủ nhiệm |
| Trưởng ban NS-TC | NS-TC, Ban Chủ nhiệm |
| Phó ban / Thành viên ban | Chỉ ban của mình |
| Người dùng | Chỉ kênh "Người dùng" |

**Đối tượng nhận tin** (khi tạo/sửa thông báo):

| Vai trò | Có thể chọn gửi đến |
|---------|---------------------|
| BCN | Tất cả tùy chọn |
| Trưởng ban | Ban chủ nhiệm, Ban mình, Tất cả thành viên, Người dùng |
| Phó ban | Ban mình, Tất cả thành viên, Người dùng |
| Thành viên ban / User | Không được đăng (không thấy form tạo) |

### 5.5. Thu chi quỹ (Fund)
| Hành động | Quyền |
|-----------|-------|
| Thêm giao dịch | BCN + Ban Nhân sự - Tài Chính |
| Duyệt giao dịch | BCN + Trưởng/Phó ban NS-TC (người tạo không duyệt được chính mình) |
| Xem danh sách, thống kê | Có vào trang Tài chính |

**Quyền thêm:** `admin`, `chairperson`, `vice_chairperson`, `head_hr_finance`, `vice_head_hr_finance`, `member_hr_finance`

**Quyền duyệt:** `admin`, `chairperson`, `vice_chairperson`, `head_hr_finance`, `vice_head_hr_finance`

### 5.6. Bảng xếp hạng (Top readers, Quà tặng)
| Hành động | Quyền |
|-----------|-------|
| Xem bảng xếp hạng, quà tặng | Mọi người đăng nhập |
| Cập nhật bảng xếp hạng (tính lại từ mượn/trả) | **Chỉ Ban Chủ nhiệm** |
| Chỉnh sửa quà tặng tháng | **Chỉ Ban Chủ nhiệm** |

*Backend: `POST /api/dashboard/top-readers/refresh` và `PATCH /api/dashboard/ranking-gifts/update` yêu cầu BCN.*

### 5.7. Nhà tài trợ & Đối tác (Đối tác)
| Hành động | Quyền |
|-----------|-------|
| Xem trang (công khai + dashboard) | Mọi người |
| Chỉnh sửa nội dung | **Ban Chủ nhiệm + Ban Nhân sự - Tài Chính** |

*Backend: `PATCH /api/doi-tac/update` yêu cầu BCN hoặc Ban NS-TC.*

**Quyền chỉnh sửa:** `admin`, `chairperson`, `vice_chairperson`, `head_hr_finance`, `vice_head_hr_finance`, `member_hr_finance`

### 5.8. Quyên góp (Donation campaigns)
| Hành động | Quyền |
|-----------|-------|
| Xem chiến dịch, danh sách đóng góp | Mọi người (công khai + dashboard) |
| Tạo / Sửa chiến dịch | **Chỉ Ban Chủ nhiệm** |
| Gửi xác nhận ủng hộ (donate) | Mọi người (không cần đăng nhập) |

*Backend: `POST /api/quyen-gop/campaign/create`, `PATCH /api/quyen-gop/campaign/<id>/update` yêu cầu BCN.*

### 5.9. Hồ sơ cá nhân
| Hành động | Quyền |
|-----------|-------|
| Xem, sửa thông tin cá nhân | Chủ tài khoản |
| Xem lịch sử mượn, lịch sử thao tác | Chủ tài khoản |

### 5.10. Tải ảnh (Upload)
| Endpoint | Quyền |
|----------|-------|
| `POST /api/upload-image` | Đang dùng cho Đối tác, Quà tặng — gọi từ form có quyền tương ứng |
| `POST /api/accounts/upload-avatar` | Đang dùng cho Hồ sơ — mọi user đăng nhập |

*Backend chưa kiểm tra quyền riêng; phụ thuộc UI che form.*

---

## 6. Tóm tắt theo vai trò

| Vai trò | Kho sách | Thành viên | Tài khoản | Thông báo | Thu chi | Xếp hạng | Đối tác | Quyên góp |
|---------|----------|------------|-----------|-----------|---------|----------|---------|-----------|
| **admin** | ✓ | ✓ | ✓ Sửa/Xóa | ✓ Đăng | ✓ Thêm, Duyệt | ✓ Cập nhật | ✓ Sửa | ✓ Tạo/Sửa |
| **chairperson** | ✓ | ✓ | ✓ Sửa/Xóa | ✓ Đăng | ✓ Thêm, Duyệt | ✓ Cập nhật | ✓ Sửa | ✓ Tạo/Sửa |
| **vice_chairperson** | ✓ | ✓ | ✓ Sửa/Xóa | ✓ Đăng | ✓ Thêm, Duyệt | ✓ Cập nhật | ✓ Sửa | ✓ Tạo/Sửa |
| **head_book** | ✓ | ✓ | ✗ | ✓ Đăng (ban mình) | ✗ | ✗ | ✗ | ✗ |
| **vice_head_book** | ✓ | ✓ | ✗ | ✓ Đăng (ban mình) | ✗ | ✗ | ✗ | ✗ |
| **member_book** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **head_communication** | ✗ | ✓ | ✗ | ✓ Đăng (ban mình) | ✗ | ✗ | ✗ | ✗ |
| **vice_head_communication** | ✗ | ✓ | ✗ | ✓ Đăng (ban mình) | ✗ | ✗ | ✗ | ✗ |
| **member_communication** | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **head_hr_finance** | ✗ | ✓ | ✓ Sửa/Xóa, Xem log | ✓ Đăng (ban mình) | ✓ Thêm, Duyệt | ✗ | ✓ Sửa | ✗ |
| **vice_head_hr_finance** | ✗ | ✓ | ✓ Sửa/Xóa, Xem log | ✓ Đăng (ban mình) | ✓ Thêm, Duyệt | ✗ | ✓ Sửa | ✗ |
| **member_hr_finance** | ✗ | ✓ | ✓ Sửa/Xóa | ✗ | ✓ Thêm | ✗ | ✓ Sửa | ✗ |
| **user** | ✗ | ✗ | ✗ | ✗ (chỉ kênh User) | ✗ | ✗ (chỉ xem) | ✗ (chỉ xem) | ✗ (chỉ xem) |

**Chú thích:**
- ✓ = Có quyền
- ✗ = Không có quyền (hoặc chỉ xem)
- "Sửa/Xóa" tài khoản: Backend chỉ cho BCN cập nhật quyền; xóa tài khoản chưa kiểm tra quyền ở backend.

---

## 7. File tham chiếu

- **Frontend:** `frontend/lib/permissions.ts`
- **Frontend (Thành viên):** `frontend/app/thanh-vien/page.tsx` (CAN_MANAGE_ACCOUNTS, CAN_VIEW_ACTIVITY_LOG)
- **Backend:** `backend/api/views.py` (`_require_ban_chu_nhiem`, `_require_doi_tac_edit`, `QUYEN_GOP_EDIT_PERMISSIONS`, `DOI_TAC_EDIT_PERMISSIONS`)
