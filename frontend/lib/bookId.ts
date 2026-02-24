/**
 * Mã sách: backend lưu id số (vd: 17), QR và tem in dùng mã 12 chữ số (vd: 000000000017).
 * Dùng format 12 chữ số thống nhất khi hiển thị để dễ đối chiếu với mã QR trên sách.
 */
export function formatBookId(id: string | number): string {
  return String(id).padStart(12, '0')
}
