/**
 * Cờ bật/tắt tính năng theo phạm vi triển khai.
 *
 * Phạm vi hiện tại của phần mềm: quản lý tài sản + kiểm kê + thanh lý.
 * Các module phụ trợ (Sửa chữa/Bảo trì, Mua sắm/Tăng tài sản, Kho vật tư)
 * CHƯA cần thiết — ẩn khỏi menu nhưng giữ nguyên code, có thể bật lại
 * bằng cách đổi cờ dưới đây thành `true`.
 */
export const FEATURES = {
  /** Bật các module Sửa chữa/Bảo trì, Mua sắm/Tăng tài sản, Kho vật tư */
  auxiliaryModules: false,
  /** Bật xác thực 2 bước (TOTP). Hiện chưa cần thiết → ẩn khỏi giao diện. */
  twoFactor: false,
};
