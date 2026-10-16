/**
 * Token trong QR code tra cứu tài sản.
 *
 * Mục đích: mã tài sản thường tuần tự (TS001, TS002...) nên ai cũng có thể
 * đoán/tra cứu qua API public. QR code của hệ thống kèm token
 * (`/scan/<MÃ>?t=<token>`) để trang tra cứu công khai chỉ phục vụ tem hợp lệ.
 *
 * QR là BẤT BIẾN: token được sinh 1 lần và lưu cùng QR trong DB. Khi xác thực,
 * ta đối chiếu token gửi lên với token ĐÃ LƯU (không tính lại) → QR sinh ra là
 * vĩnh viễn, không phụ thuộc secret/domain. Secret dưới đây chỉ dùng để sinh
 * token ban đầu. Bật/tắt bắt buộc xác thực bằng QR_REQUIRE_SIGNATURE.
 */
import crypto from 'crypto';

const SECRET =
  process.env.QR_SIGNING_SECRET ||
  process.env.JWT_SECRET ||
  'qr-dev-secret-change-me';

/** Bắt buộc token hợp lệ trên trang tra cứu công khai? (mặc định: có) */
export const QR_REQUIRE_SIGNATURE = (process.env.QR_REQUIRE_SIGNATURE ?? 'true') !== 'false';

function normalize(assetCode: string): string {
  return String(assetCode || '').trim().toUpperCase();
}

/** Sinh token ngắn (24 ký tự base64url) cho một mã tài sản. */
export function signAssetCode(assetCode: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(normalize(assetCode))
    .digest('base64url')
    .slice(0, 24);
}

/** Xác thực token của một mã tài sản (so sánh an toàn theo thời gian). */
export function verifyAssetCode(assetCode: string, token?: string | null): boolean {
  if (!token) return false;
  const expected = signAssetCode(assetCode);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
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
 * Xác thực token tra cứu công khai dựa trên token ĐÃ LƯU trong QR của tài sản
 * (không phụ thuộc secret/domain → QR sinh ra là vĩnh viễn).
 * - Nếu QR đã có token: bắt buộc token gửi lên phải khớp.
 * - Nếu QR là định dạng cũ (không token): cho phép (tương thích tem đã in).
 */
export function isQrTokenValid(storedQrCode: string | null | undefined, providedToken?: string | null): boolean {
  const stored = extractQrToken(storedQrCode);
  if (!stored) return true; // tem cũ không token → không chặn
  return tokensMatch(stored, providedToken);
}

