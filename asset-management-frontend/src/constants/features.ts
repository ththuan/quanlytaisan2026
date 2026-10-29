/**
 * Bật/tắt tính năng theo phạm vi triển khai.
 *
 * Các module phụ trợ có thể bật lại bằng cách đổi cờ tương ứng thành `true`.
 * Code vẫn được giữ nguyên, chỉ ẩn/hiện menu và chức năng.
 */
export const FEATURES = {
  /** Module Sửa chữa/Bảo trì, Mua sắm/Tăng tài sản (admin) */
  auxiliaryModules: false,
  /** Module Kho vật tư (admin) */
  stockModule: true,
  /** Xác thực 2 bước (TOTP) */
  twoFactor: false,
};
