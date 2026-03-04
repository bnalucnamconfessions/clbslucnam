# Phân quyền và chức năng theo vai trò

Tài liệu mô tả **tất cả vai trò**, **chức năng** và **quyền hạn** tương ứng trong hệ thống CLB Sách và Hành động THPT Lục Nam.

---

## 0. Tổng quan chức năng

| Chức năng | Mô tả ngắn | Trang / Menu | Ai được dùng |
|-----------|------------|--------------|--------------|
| **Kho sách** | Quản lý đầu sách, thêm/sửa/xóa sách | `/books` | BCN + Ban Quản lý Sách |
| **Mã QR** | Tạo mã QR cho sách (đơn lẻ hoặc hàng loạt), in mã | `/qr` | BCN + Ban Quản lý Sách |
| **Mượn sách** | Tạo phiếu mượn (chọn thành viên + sách), quét QR | `/muon` | BCN + Ban Quản lý Sách |
| **Trả sách** | Xác nhận trả sách, quét mã sách | `/tra` | BCN + Ban Quản lý Sách |
| **Thành viên** | Danh sách thành viên CLB + tài khoản đăng nhập; thêm/sửa/xóa thành viên; đổi quyền/xóa tài khoản | `/thanh-vien` | Thành viên có vai trò (trừ user); sửa quyền chỉ BCN |
| **Tổng quan** | Thống kê mượn/trả, quỹ, quyên góp, sách quá hạn, xếp hạng | `/dashboard` | Thành viên có vai trò |
| **Tài chính** | Thu chi quỹ: thêm giao dịch, duyệt/chờ duyệt | `/dashboard/tai-chinh` | BCN + Ban NS-TC (thêm); duyệt: BCN + Trưởng/Phó NS-TC |
| **Thông báo** | Đăng/sửa/xóa thông báo theo kênh (ban, người dùng) | `/thong-bao` | BCN + Trưởng/Phó ban (theo kênh) |
| **Xếp hạng** | Bảng top đọc sách, quà tặng tháng; cập nhật dữ liệu/sửa quà | `/dashboard/xep-hang` | Xem: mọi người; Cập nhật/Sửa quà: BCN |
| **Đối tác** | Nhà tài trợ, đối tác chiến lược/cộng đồng; chỉnh nội dung + tải ảnh | `/dashboard/doi-tac`, công khai | Xem: mọi người; Sửa: BCN + Ban NS-TC |
| **Quyên góp** | Chiến dịch quyên góp, danh sách ủng hộ; tạo/sửa chiến dịch | `/dashboard/quyen-gop`, công khai | Xem/ủng hộ: mọi người; Tạo/Sửa chiến dịch: BCN |
| **Hồ sơ** | Thông tin cá nhân, avatar, lịch sử mượn, lịch sử thao tác | `/ho-so` | Chủ tài khoản |
| **Đăng nhập/Đăng ký** | Email + mật khẩu, Google, quên mật khẩu, xác thực email | `/dang-nhap` | Khách / User |

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
| `/muon` | Mượn sách (tự mượn cho mình) |
| `/tra` | Trả sách (trả phiếu của mình) |

**Bị chặn:** `/books`, `/qr`, `/thanh-vien`, `/dashboard` (tổng quan).

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
Hiển thị cho:
- BCN: `admin`, `chairperson`, `vice_chairperson`
- Ban Quản lý Sách: `head_book`, `vice_head_book`, `member_book`
- Người dùng (`user`): chỉ thấy Mượn sách và Trả sách (vào `/books`, `/qr` vẫn bị chặn)

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

*Backend kiểm tra quyền:* `_require_kho_sach` — BCN + Ban Quản lý Sách (`admin`, `chairperson`, `vice_chairperson`, `head_book`, `vice_head_book`, `member_book`). API: `/api/books`, `/api/books/create`, `/api/books/bulk-create`, `/api/books/<id>`, `/api/books/<id>/delete`, `/api/borrow`, `/api/borrow/create`, `/api/return`.

### 5.2. Thành viên (Members)
| Hành động | Quyền |
|-----------|-------|
| Xem danh sách thành viên CLB | Thành viên có vai trò |
| Thêm / Sửa / Xóa thành viên | Thành viên có vai trò |

*Backend kiểm tra quyền:* `_require_thanh_vien` — Thành viên có vai trò (`club_permission !== 'user'`). API: `/api/members`, `/api/members/create`, `/api/members/<id>`, `/api/members/<id>/delete`. `/api/dashboard/overdue` cũng yêu cầu thành viên có vai trò.

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
| `POST /api/upload-image` | **BCN + Ban Nhân sự - Tài Chính** (Đối tác, Quà tặng) |
| `POST /api/accounts/upload-avatar` | **Mọi user đăng nhập** (Hồ sơ) |

*Backend kiểm tra quyền:* `upload_image` dùng `_require_doi_tac_edit`; `account_upload_avatar` dùng `_get_account_from_request` (chỉ cần đăng nhập).

---

## 6. Chi tiết từng chức năng và phân quyền

### 6.1. Kho sách (Books)
- **Chức năng:** Quản lý đầu sách trong thư viện CLB (tên, tác giả, thể loại, nhà xuất bản, giá, trạng thái mượn).
- **Trang:** `/books` (menu "Kho sách").
- **Hành động:** Xem danh sách | Thêm sách | Sửa sách | Xóa sách (không xóa được sách đang mượn).
- **Phân quyền:** Chỉ BCN + Ban Quản lý Sách. Backend kiểm tra `_require_kho_sach`.
- **API:** `GET/POST /api/books`, `PUT /api/books/<id>`, `DELETE /api/books/<id>/delete`.

### 6.2. Mã QR (QR)
- **Chức năng:** Tạo sách mới (form nhập thông tin) hoặc tạo hàng loạt sách placeholder để in mã QR; xem danh sách và in mã.
- **Trang:** `/qr` (menu "Mã QR").
- **Hành động:** Thêm sách đơn (form) | Tạo mã QR hàng loạt (1–100 bản) | In mã QR.
- **Phân quyền:** Giống Kho sách (BCN + Ban Quản lý Sách). API `POST /api/books/create`, `POST /api/books/bulk-create` có kiểm tra quyền.

### 6.3. Mượn sách
- **Chức năng:** Tạo phiếu mượn: chọn thành viên (QR hoặc tay), chọn tối đa 3 sách, xác nhận mượn.
- **Trang:** `/muon` (menu "Mượn sách").
- **Hành động:** Xem sách còn trống, danh sách thành viên | Tạo phiếu mượn (bookId + memberId).
- **Phân quyền:** BCN + Ban Quản lý Sách. Backend: `_require_kho_sach` cho `/api/borrow`, `/api/borrow/create`, `/api/books`, `/api/members` (trang này gọi cả hai).

### 6.4. Trả sách
- **Chức năng:** Xem danh sách phiếu mượn chưa trả; quét mã sách hoặc chọn phiếu để xác nhận trả.
- **Trang:** `/tra` (menu "Trả sách").
- **Hành động:** Xem danh sách mượn | Xác nhận trả (recordId).
- **Phân quyền:** BCN + Ban Quản lý Sách. API: `GET /api/borrow`, `POST /api/return`.

### 6.5. Thành viên (Members + Accounts)
- **Chức năng:** Hai tab — (1) Thành viên CLB: danh sách thành viên, thêm/sửa/xóa thành viên; (2) Tài khoản đăng nhập: danh sách tài khoản, đổi quyền (club_permission), xóa tài khoản, xem lịch sử thao tác.
- **Trang:** `/thanh-vien`.
- **Hành động:**  
  - Thành viên CLB: Xem | Thêm | Sửa | Xóa (không xóa được nếu đang có sách mượn chưa trả).  
  - Tài khoản: Xem | Đổi quyền (chỉ BCN gọi API thành công) | Xóa | Xem lịch sử thao tác (chỉ BCN + Trưởng/Phó ban NS-TC).
- **Phân quyền:** Vào trang và thao tác thành viên CLB: bất kỳ thành viên có vai trò (`_require_thanh_vien`). Đổi quyền tài khoản: chỉ BCN (`_require_ban_chu_nhiem`). Cột "Lịch sử thao tác": chỉ BCN + head_hr_finance, vice_head_hr_finance.

### 6.6. Tổng quan (Dashboard)
- **Chức năng:** Thống kê nhanh (mượn hôm nay/tháng, sách quá hạn, thành viên), top đọc sách, sách quá hạn, quỹ, chiến dịch quyên góp, thông báo; link nhanh tới các trang.
- **Trang:** `/dashboard`.
- **Phân quyền:** Chỉ thành viên có vai trò mới vào được (user bị redirect về `/dashboard/xep-hang`). API `/api/dashboard/overdue` yêu cầu `_require_thanh_vien`.

### 6.7. Tài chính (Thu chi quỹ)
- **Chức năng:** Xem tổng quỹ, thu/chi tháng, giao dịch chờ duyệt; thêm giao dịch thu/chi; duyệt giao dịch (người tạo không duyệt được chính mình).
- **Trang:** `/dashboard/tai-chinh`.
- **Phân quyền:** Thêm: BCN + Ban NS-TC (head/vice/member_hr_finance). Duyệt: BCN + Trưởng/Phó ban NS-TC (không có member_hr_finance).

### 6.8. Thông báo
- **Chức năng:** Xem thông báo theo kênh (Ban Chủ nhiệm, Quản lý sách, Truyền thông, NS-TC, Tất cả, Người dùng); tạo/sửa/xóa thông báo (theo đối tượng nhận tin và quyền).
- **Trang:** `/thong-bao`.
- **Phân quyền:** Đăng/sửa/xóa: BCN + Trưởng ban + Phó ban. Kênh và đối tượng nhận tin phụ thuộc vai trò (xem bảng mục 5.4).

### 6.9. Bảng xếp hạng (Xếp hạng)
- **Chức năng:** Xem top đọc sách (tháng/năm), quà tặng tháng; BCN: nút "Cập nhật bảng xếp hạng" (tính lại từ mượn/trả), chỉnh sửa nội dung quà tặng (tiêu đề, ảnh, mô tả).
- **Trang:** `/dashboard/xep-hang`.
- **Phân quyền:** Xem: mọi người đăng nhập. Cập nhật bảng + Sửa quà: chỉ BCN. API: `POST /api/dashboard/top-readers/refresh`, `PATCH /api/dashboard/ranking-gifts/update` dùng `_require_ban_chu_nhiem`.

### 6.10. Đối tác (Nhà tài trợ & Đối tác)
- **Chức năng:** Xem/cập nhật nội dung Nhà tài trợ vàng, Đối tác chiến lược, Đối tác cộng đồng (tên, mô tả, ảnh, link); tải ảnh lên server.
- **Trang:** `/dashboard/doi-tac` (và trang công khai).
- **Phân quyền:** Xem: mọi người. Chỉnh sửa + tải ảnh: BCN + Ban NS-TC (`_require_doi_tac_edit`, `_require_doi_tac_edit` cho upload-image).

### 6.11. Quyên góp
- **Chức năng:** Xem chiến dịch quyên góp, tiến độ, danh sách ủng hộ; BCN: tạo/sửa chiến dịch. Công khai: form ủng hộ (không cần đăng nhập).
- **Trang:** `/dashboard/quyen-gop`, trang quyên góp công khai.
- **Phân quyền:** Xem/ủng hộ: mọi người. Tạo/Sửa chiến dịch: chỉ BCN.

### 6.12. Hồ sơ cá nhân
- **Chức năng:** Xem/sửa tên, email hiển thị, avatar; xem lịch sử mượn, lịch sử thao tác của chính tài khoản.
- **Trang:** `/ho-so`.
- **Phân quyền:** Chỉ chủ tài khoản (xem/sửa theo tài khoản đăng nhập). Upload avatar: mọi user đăng nhập (`_get_account_from_request`).

### 6.13. Đăng nhập / Đăng ký
- **Chức năng:** Đăng nhập email + mật khẩu; đăng nhập Google; đăng ký tài khoản (gửi mã xác thực email, nhập mã + mật khẩu); quên mật khẩu (gửi link đặt lại).
- **Trang:** `/dang-nhap`.
- **Phân quyền:** Không phân quyền (trang công cộng). Sau đăng nhập, user/user có vai trò được redirect theo quyền (xem mục 3).

---

## 7. Tóm tắt theo vai trò

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

## 8. Kiểm tra liên kết phân quyền (Frontend – Backend)

### 8.1. Đã liên kết chặt chẽ

| Nhóm | Frontend | Backend | Ghi chú |
|------|----------|---------|--------|
| **Kho sách** | `SIDEBAR_SHOW_BOOK_MENU` | `KHO_SACH_PERMISSIONS` + `_require_kho_sach` | Khớp danh sách; API books/borrow/return đều kiểm tra. |
| **Thành viên (CLB)** | Route `/thanh-vien` (user bị chặn) | `THANH_VIEN_PERMISSIONS` + `_require_thanh_vien` | API members + overdue kiểm tra. |
| **BCN (Quyên góp, Xếp hạng, Quyền tài khoản)** | `BAN_CHU_NHIEM`, `canEditQuyenGop`, `canEditXepHang` | `QUYEN_GOP_EDIT_PERMISSIONS` + `_require_ban_chu_nhiem` | Khớp; API permission/refresh/ranking-gifts kiểm tra. |
| **Đối tác** | `DOI_TAC_CAN_EDIT`, `canEditDoiTac` | `DOI_TAC_EDIT_PERMISSIONS` + `_require_doi_tac_edit` | Khớp; doi-tac/update và upload-image kiểm tra. |
| **Tài chính** | `FINANCE_CAN_ADD_TRANSACTION`, `FINANCE_CAN_APPROVE` | Chưa kiểm tra quyền thêm/duyệt ở backend | UI ẩn nút theo quyền; backend chưa chặn theo vai trò. |
| **Upload ảnh** | Form chỉ hiện khi có quyền Đối tác/Xếp hạng | `_require_doi_tac_edit` / `_get_account_from_request` | upload-image và upload-avatar có kiểm tra. |

### 8.2. Đã bổ sung kiểm tra quyền (đã sửa)

| API / Hành động | Cách kiểm tra backend |
|------------------|------------------------|
| **GET /api/accounts** | `_require_thanh_vien` — chỉ thành viên có vai trò. |
| **DELETE /api/accounts/<id>/delete** | `_require_ban_chu_nhiem` — chỉ BCN. |
| **GET /api/activity-log?email=** | Lấy caller từ request; trả log chỉ nếu caller = chủ tài khoản đó **hoặc** caller thuộc `ACTIVITY_LOG_VIEW_PERMISSIONS` (BCN + Trưởng/Phó ban NS-TC). |
| **POST /api/activity-log/create** | Chỉ cho ghi log khi `email` trong body trùng với tài khoản người gọi. |
| **GET /api/notifications** | Lọc theo `club_permission` của người gọi (chỉ trả thông báo đúng đối tượng); yêu cầu đăng nhập. |
| **POST /api/notifications/create**, **PUT/DELETE** | Kiểm tra caller thuộc `NOTIFICATION_POST_PERMISSIONS` (BCN + Trưởng/Phó ban). |
| **GET /api/dashboard/stats**, **GET /api/fund/stats**, **GET /api/fund/transactions** | `_require_thanh_vien`. |
| **POST /api/fund/transactions/create** | Caller thuộc `FINANCE_CAN_ADD_PERMISSIONS` (BCN + Ban NS-TC). |
| **PATCH /api/fund/transactions/<id>/update** (đổi status) | Caller thuộc `FINANCE_CAN_APPROVE_PERMISSIONS` (BCN + Trưởng/Phó ban NS-TC). |

Frontend đã gửi `Authorization` và/hoặc `accountEmail` cho các API trên (getApiAuth, apiUrlWithAuth).

### 8.3. Khác biệt Frontend – Backend (cố ý)

| Chức năng | Frontend | Backend | Lý do |
|------------|----------|---------|--------|
| **Đổi quyền tài khoản** | Nút hiện cho BCN + Ban NS-TC (`CAN_MANAGE_ACCOUNTS`) | Chỉ BCN gọi thành công (`_require_ban_chu_nhiem`) | Cho Ban NS-TC thấy nút để biết chức năng; API từ chối 403 nếu không phải BCN. |

---

## 9. File tham chiếu

- **Frontend:** `frontend/lib/permissions.ts`
- **Frontend (Thành viên):** `frontend/app/thanh-vien/page.tsx` (CAN_MANAGE_ACCOUNTS, CAN_VIEW_ACTIVITY_LOG)
- **Backend:** `backend/api/views.py` — helpers: `_require_ban_chu_nhiem`, `_require_doi_tac_edit`, `_require_kho_sach`, `_require_thanh_vien`, `_get_account_from_request`. Hằng số: `KHO_SACH_PERMISSIONS`, `THANH_VIEN_PERMISSIONS`, `QUYEN_GOP_EDIT_PERMISSIONS`, `DOI_TAC_EDIT_PERMISSIONS`, `ACTIVITY_LOG_VIEW_PERMISSIONS`, `NOTIFICATION_POST_PERMISSIONS`, `FINANCE_CAN_ADD_PERMISSIONS`, `FINANCE_CAN_APPROVE_PERMISSIONS`.
