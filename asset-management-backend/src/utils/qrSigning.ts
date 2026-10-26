/**
 * Token trong QR code tra cứu tài sản.
 *
 * Mục đích: mã tài sản thường tuần tự (TS001, TS002...) nên ai cũng có thể
 * đoán/tra cứu qua API public. QR code của hệ thống kèm token
 * (`/scan/<MÃ>?t=<token>`) để trang tra cứu công khai chỉ phục vụ tem hợp lệ.
 *
 * QR là BẤT BIẾN: token được sinh NGẪU NHIÊN 1 lần (duy nhất cho mỗi QR) và lưu
 * cùng QR trong DB. Khi xác thực, đối chiếu token gửi lên với token ĐÃ LƯU —
 * không phụ thuộc secret/domain, và mỗi lần reset/tạo lại tài sản sẽ ra QR mới.
 * Bật/tắt bắt buộc xác thực bằng QR_REQUIRE_SIGNATURE.
 */
import crypto from 'crypto';

/** Bắt buộc token hợp lệ trên trang tra cứu công khai? (mặc định: có) */
export const QR_REQUIRE_SIGNATURE = (process.env.QR_REQUIRE_SIGNATURE ?? 'true') !== 'false';

/** Sinh token ngẫu nhiên, duy nhất cho một QR (8 ký tự base64url — ngắn để QR bớt dày, dễ quét). */
export function generateQrToken(): string {
  return crypto.randomBytes(6).toString('base64url');
}

/**
 * Lấy token đã lưu trong chuỗi QR của tài sản (`.../scan/MÃ?t=<token>`).
 * Trả về null nếu QR là định dạng cũ (không có token).
 */
export function extractQrToken(qrCode?: string | null): string | null {
  if (!qrCode) return null;
  const idx = qrCode.indexOf('?t=');
  if (idx === -1) return null;
  const token = qrCode.slice(idx + 3).split('&')[0];
  return token || null;
}

/** So sánh 2 token an toàn theo thời gian. */
export function tokensMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Xác thực token tra cứu công khai dựa trên token ĐÃ LƯU trong QR của tài sản.
 * - Nếu QR đã có token: bắt buộc token gửi lên phải khớp.
 * - Nếu QR là định dạng cũ (không token): cho phép (tương thích tem đã in).
 */
export function isQrTokenValid(storedQrCode: string | null | undefined, providedToken?: string | null): boolean {
  const stored = extractQrToken(storedQrCode);
  if (!stored) return true; // tem cũ không token → không chặn
  return tokensMatch(stored, providedToken);
}
