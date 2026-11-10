import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

export interface PWAUpdateState {
  needRefresh: ReturnType<typeof ref<boolean>>;
  updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
  offlineReady: ReturnType<typeof ref<boolean>>;
}

let pwaState: PWAUpdateState | null = null;

/**
 * Đăng ký service worker để PWA có thể cài như ứng dụng thật và mở được
 * app shell khi mất mạng. Bản mới sẽ hiện thông báo cập nhật (không tự ý
 * chạy bản cũ nếu người dùng chưa xác nhận).
 */
export function initPWA(): PWAUpdateState {
  if (pwaState) return pwaState;

  const needRefresh = ref(false);
  const offlineReady = ref(false);
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;

  try {
    updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.value = true;
      },
      onOfflineReady() {
        offlineReady.value = true;
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        // Kiểm tra bản mới định kỳ; vẫn cần người dùng bấm Cập nhật.
        window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
    });
  } catch (error) {
    console.warn('[PWA] Service worker unavailable:', error);
  }

  pwaState = { needRefresh, offlineReady, updateServiceWorker };
  return pwaState;
}

export function getPWAState(): PWAUpdateState | null {
  return pwaState;
}
