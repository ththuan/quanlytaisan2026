/**
 * Tự phát hiện bản build mới và nạp lại trang.
 *
 * Cách hoạt động: định kỳ (và khi tab được focus lại) tải lại `/index.html`
 * với cache: 'no-store', đọc tên bundle chính (/assets/index-XXXX.js). Nếu tên
 * khác bundle đang chạy → có bản mới → tự nạp lại (tối đa 1 lần / phiên ngắn).
 *
 * Nhờ vậy người dùng không cần xóa cache/F5 thủ công sau mỗi lần deploy.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 phút
const RELOAD_GUARD_KEY = 'app-last-auto-reload';

function currentBundleName(): string | null {
  const el = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]');
  if (!el) return null;
  const src = el.getAttribute('src') || '';
  const m = src.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
  return m ? m[0] : null;
}

let checking = false;

async function checkForUpdate(): Promise<void> {
  if (checking) return;
  const current = currentBundleName();
  if (!current) return;

  checking = true;
  try {
    const res = await fetch(`/index.html?ts=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const html = await res.text();
    const m = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
    if (!m) return;

    if (m[0] !== current) {
      // Chống lặp reload quá nhanh (nếu server/CDN còn chập chờn)
      const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      console.log('[update] Có bản mới → nạp lại trang');
      window.location.reload();
    }
  } catch {
    // bỏ qua lỗi mạng
  } finally {
    checking = false;
  }
}

export function initUpdateCheck(): void {
  // Kiểm tra khi tab được quay lại (đa số trường hợp)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate();
  });
  // Kiểm tra định kỳ cho tab mở lâu
  window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
  // Kiểm tra ngay sau khi khởi động (chậm 10s cho app ổn định)
  window.setTimeout(checkForUpdate, 10_000);
}
