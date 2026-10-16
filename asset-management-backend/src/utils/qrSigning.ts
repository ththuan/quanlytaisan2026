/**
 * Ký và xác thực mã tài sản trong QR code.
 *
 * Mục đích: mã tài sản thường tuần tự (TS001, TS002...) nên ai cũng có thể
 * đoán/tra cứu qua API public. QR code của hệ thống sẽ kèm token HMAC
 * (`/scan/<MÃ>?t=<token>`) để trang tra cứu công khai chỉ phục vụ những mã
 * do hệ thống phát hành.
 *
 * Secret lấy từ QR_SIGNING_SECRET, fallback JWT_SECRET. Có thể bật/tắt bắt
 * buộc xác thực bằng biến môi trường QR_REQUIRE_SIGNATURE (mặc định: bật).
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
