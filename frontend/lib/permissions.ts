/**
 * Phân quyền dùng chung: RequireAuth, Sidebar, Thông báo, Thành viên.
 * Một nguồn để đồng bộ quyền truy cập và hiển thị.
 */

/** Chuẩn hóa quyền: lowercase, qtv -> admin */
export function normalizePermission(permission: string): string {
  const p = (permission || 'user').toLowerCase()
  return p === 'qtv' ? 'admin' : p
}

/** Nhãn hiển thị theo clubPermission (khớp Thành viên / Hồ sơ). */
export const PERM_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  qtv: 'Quản trị viên',
  chairperson: 'Chủ nhiệm',
  vice_chairperson: 'Phó Chủ nhiệm',
  head_book: 'Trưởng ban Quản lý Sách',
  vice_head_book: 'Phó ban Quản lý Sách',
  head_communication: 'Trưởng ban Truyền thông - Đối Ngoại',
  vice_head_communication: 'Phó ban Truyền thông - Đối Ngoại',
  head_hr_finance: 'Trưởng ban Nhân sự - Tài Chính',
  vice_head_hr_finance: 'Phó ban Nhân sự - Tài Chính',
  member_book: 'Thành viên ban Quản lý sách',
  member_communication: 'Thành viên ban Truyền thông - Đối Ngoại',
  member_hr_finance: 'Thành viên ban Nhân sự - Tài Chính',
  user: 'Người dùng',
}

/** Người dùng (user): đường dẫn được phép vào (xem trang). /dashboard/doi-tac: mọi người xem được, chỉ Ban chủ nhiệm + Ban Nhân sự chỉnh sửa (canEditDoiTac). */
export const USER_ALLOWED_PATHS = ['/dashboard/xep-hang', '/dashboard/quyen-gop', '/dashboard/doi-tac', '/ho-so', '/thong-bao']

/** Người dùng (user): đường dẫn bị chặn, redirect về dashboard/xep-hang. */
export const USER_RESTRICTED_PREFIXES = ['/books', '/qr', '/muon', '/tra', '/thanh-vien']

/** Sidebar: quyền được thấy menu Kho sách, Mã QR, Mượn, Trả. Trưởng ban thuộc BCN; Phó ban thuộc các ban. */
export const SIDEBAR_SHOW_BOOK_MENU: string[] = [
  'admin', 'chairperson', 'vice_chairperson',
  'head_book', 'vice_head_book', 'member_book',
]

/** Tài chính: quyền thêm giao dịch — Ban chủ nhiệm (QTV, Chủ nhiệm, Phó Chủ nhiệm) + Ban Nhân sự - Tài Chính. */
export const FINANCE_CAN_ADD_TRANSACTION: string[] = [
  'admin', 'chairperson', 'vice_chairperson',
  'head_hr_finance', 'vice_head_hr_finance', 'member_hr_finance',
]

/** Tài chính: quyền duyệt giao dịch — QTV, Chủ nhiệm, Phó Chủ nhiệm, Trưởng/Phó ban Nhân sự - Tài Chính (người tạo không duyệt được chính mình, xử lý ở UI). */
export const FINANCE_CAN_APPROVE: string[] = [
  'admin', 'chairperson', 'vice_chairperson',
  'head_hr_finance', 'vice_head_hr_finance',
]

export function canAddFinanceTransaction(permission: string): boolean {
  return FINANCE_CAN_ADD_TRANSACTION.includes(normalizePermission(permission))
}

export function canApproveFinance(permission: string): boolean {
  return FINANCE_CAN_APPROVE.includes(normalizePermission(permission))
}

/** Nhà tài trợ & Đối tác: quyền xem trang quản trị và chỉnh sửa — chỉ Ban chủ nhiệm + Ban Nhân sự - Tài Chính. */
export const DOI_TAC_CAN_EDIT: string[] = [
  'admin', 'chairperson', 'vice_chairperson',
  'head_hr_finance', 'vice_head_hr_finance', 'member_hr_finance',
]

export function canEditDoiTac(permission: string): boolean {
  return DOI_TAC_CAN_EDIT.includes(normalizePermission(permission))
}

/** Ban chủ nhiệm (QTV, Chủ nhiệm, Phó Chủ nhiệm) — dùng chung cho quyên góp, xếp hạng, cập nhật quyền tài khoản. Khớp backend QUYEN_GOP_EDIT_PERMISSIONS. */
export const BAN_CHU_NHIEM: readonly string[] = [
  'admin', 'chairperson', 'vice_chairperson',
]

/** Quyên góp: quyền chỉnh sửa chiến dịch (tạo/sửa) — chỉ Ban chủ nhiệm. */
export const QUYEN_GOP_CAN_EDIT: readonly string[] = BAN_CHU_NHIEM

export function canEditQuyenGop(permission: string): boolean {
  return QUYEN_GOP_CAN_EDIT.includes(normalizePermission(permission))
}

/** Bảng xếp hạng: quyền cập nhật bảng xếp hạng (tính lại từ mượn/trả) — chỉ Ban chủ nhiệm. */
export const XEP_HANG_CAN_EDIT: readonly string[] = BAN_CHU_NHIEM

export function canEditXepHang(permission: string): boolean {
  return XEP_HANG_CAN_EDIT.includes(normalizePermission(permission))
}

/** Thông báo: đối tượng nhận tin (dùng trong form tạo/sửa). */
export const NOTIFICATION_AUDIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Ban chủ nhiệm', label: 'Ban chủ nhiệm' },
  { value: 'Ban Quản lý Sách', label: 'Ban Quản lý Sách' },
  { value: 'Ban Truyền thông - Đối Ngoại', label: 'Ban Truyền thông - Đối Ngoại' },
  { value: 'Ban Nhân sự - Tài Chính', label: 'Ban Nhân sự - Tài Chính' },
  { value: 'Tất cả thành viên', label: 'Tất cả thành viên' },
  { value: 'Người dùng', label: 'Gửi đến người dùng' },
]

/** Thông báo: map quyền -> nhãn người gửi (dùng trong modal chi tiết). */
export function getSenderLabel(permission: string): string {
  const p = normalizePermission(permission)
  if (p.startsWith('member_')) return 'Thành viên ban'
  return PERM_LABELS[p] || 'Không xác định'
}

/** Thông báo: quyền được đăng/sửa/xóa thông báo. QTV, CN, PCN, Trưởng ban, Phó ban. */
export function canPostNotifications(permission: string): boolean {
  const p = normalizePermission(permission)
  if (p === 'admin' || p === 'chairperson' || p === 'vice_chairperson') return true
  if (p.startsWith('head_') || p.startsWith('vice_head_')) return true
  return false
}

/** Thông báo: kênh hiển thị trên sidebar. QTV/CN/PCN: tất cả; Trưởng ban: BCN + ban mình; Phó/Thành viên: ban; User: chỉ kênh "Người dùng". */
export function getVisibleChannelIds(permission: string): string[] {
  const p = normalizePermission(permission)
  const all = ['book', 'communication', 'hr', 'exec']
  if (p === 'admin' || p === 'chairperson' || p === 'vice_chairperson') return all
  if (p === 'head_book') return ['book', 'exec']
  if (p === 'head_communication') return ['communication', 'exec']
  if (p === 'head_hr_finance') return ['hr', 'exec']
  if (p === 'vice_head_book' || p === 'member_book') return ['book']
  if (p === 'vice_head_communication' || p === 'member_communication') return ['communication']
  if (p === 'vice_head_hr_finance' || p === 'member_hr_finance') return ['hr']
  return ['user']
}

/** Thông báo: đối tượng nhận tin được chọn trong form (theo quyền). */
export function getAllowedAudienceOptions(permission: string): { value: string; label: string }[] {
  const p = normalizePermission(permission)
  const opts = NOTIFICATION_AUDIENCE_OPTIONS
  if (p === 'admin' || p === 'chairperson' || p === 'vice_chairperson') return opts
  if (p === 'head_book') return opts.filter(o => ['Ban chủ nhiệm', 'Ban Quản lý Sách', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  if (p === 'head_communication') return opts.filter(o => ['Ban chủ nhiệm', 'Ban Truyền thông - Đối Ngoại', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  if (p === 'head_hr_finance') return opts.filter(o => ['Ban chủ nhiệm', 'Ban Nhân sự - Tài Chính', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  if (p === 'vice_head_book') return opts.filter(o => ['Ban Quản lý Sách', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  if (p === 'vice_head_communication') return opts.filter(o => ['Ban Truyền thông - Đối Ngoại', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  if (p === 'vice_head_hr_finance') return opts.filter(o => ['Ban Nhân sự - Tài Chính', 'Tất cả thành viên', 'Người dùng'].includes(o.value))
  return []
}
