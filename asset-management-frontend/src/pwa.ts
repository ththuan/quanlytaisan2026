import { ref } from 'vue';

export interface PWAUpdateState {
  needRefresh: ReturnType<typeof ref<boolean>>;
  updateServiceWorker: (() => Promise<void>) | undefined;
  offlineReady: ReturnType<typeof ref<boolean>>;
}

let pwaState: PWAUpdateState | null = null;

/**
 * PWA / Service Worker ĐÃ BỊ TẮT.
 *
 * Nguyên nhân: trước đây app dùng service worker (vite-plugin-pwa) để cache
 * app shell (index.html + JS). Hệ quả là sau khi deploy, trình duyệt vẫn phục
 * vụ bản cũ từ cache SW — kể cả khi Ctrl+Shift+R. Vì đây là app nội bộ, không
 * cần offline, nên ta chủ động GỠ service worker và xóa toàn bộ cache để mọi
 * máy nhanh chóng nhận bản mới.
 */
export function initPWA(): PWAUpdateState {
  if (pwaState) return pwaState;

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister().catch(() => undefined)))
        .catch(() => undefined);
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => undefined);
    }
  } catch {
    // ignore
  }

  pwaState = {
    needRefresh: ref(false),
    updateServiceWorker: undefined,
    offlineReady: ref(false),
  };
  return pwaState;
}

export function getPWAState(): PWAUpdateState | null {
  return pwaState;
}
