import { ref } from 'vue';

export interface PWAUpdateState {
  needRefresh: ReturnType<typeof ref<boolean>>;
  updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
  offlineReady: ReturnType<typeof ref<boolean>>;
}

let pwaState: PWAUpdateState | null = null;
let registrationStarted = false;

const SAFARI_UNREGISTER_KEY = 'pwa-safari-sw-unregistered';

const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOSSafari = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isDesktopSafari = (): boolean =>
  /Safari/i.test(navigator.userAgent)
  && !/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Opera|Android)/i.test(navigator.userAgent);

const isSafariWebKit = (): boolean => isIOSSafari() || isDesktopSafari();

// WebKit/Safari có thể treo khi service worker hoạt động cùng app.
// Không đăng ký/không cập nhật SW trên Safari; giữ SW cũ (nếu có) cho PWA đã cài.
const shouldRegisterPWA = (): boolean => !isSafariWebKit();

const createPWAState = (): PWAUpdateState => ({
  needRefresh: ref(false),
  offlineReady: ref(false),
  updateServiceWorker: undefined,
});

export function getPWAState(): PWAUpdateState {
  if (!pwaState) pwaState = createPWAState();
  return pwaState;
}

/**
 * Đăng ký service worker bằng API gốc của trình duyệt.
 * Không dùng workbox-window vì WebKit/Safari có thể bị treo khi vừa tải app
 * vừa đăng ký service worker. Việc đăng ký được gọi sau khi app đã render.
 */
/**
 * Gỡ service worker cũ trên Safari (chế độ trình duyệt) để tránh màn hình trắng.
 * PWA đã cài (standalone) vẫn được giữ service worker.
 */
export async function preparePWA(): Promise<void> {
  if (!('serviceWorker' in navigator) || !isSafariWebKit() || isStandalone()) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length) {
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if (navigator.serviceWorker.controller) {
      if (!sessionStorage.getItem(SAFARI_UNREGISTER_KEY)) {
        sessionStorage.setItem(SAFARI_UNREGISTER_KEY, '1');
        window.location.reload();
        return;
      }
    } else {
      sessionStorage.removeItem(SAFARI_UNREGISTER_KEY);
    }
  } catch {
    // Safari cũ không hỗ trợ getRegistrations - bỏ qua an toàn.
  }
}

export function initPWA(): PWAUpdateState {
  const state = getPWAState();
  if (registrationStarted) return state;
  registrationStarted = true;

  if (!('serviceWorker' in navigator) || !shouldRegisterPWA()) return state;

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  const swScope = import.meta.env.BASE_URL;
  let pendingReload = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!pendingReload) return;
    pendingReload = false;
    window.location.reload();
  });

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(swUrl, { scope: swScope });

      const markWaitingUpdate = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          state.needRefresh.value = true;
        }
      };

      markWaitingUpdate();

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state !== 'installed') return;
          if (navigator.serviceWorker.controller) {
            state.needRefresh.value = true;
          } else {
            state.offlineReady.value = true;
          }
        });
      });

      state.updateServiceWorker = async (reloadPage = true) => {
        const waitingWorker = registration.waiting;
        if (!waitingWorker) {
          if (reloadPage) window.location.reload();
          return;
        }

        pendingReload = reloadPage;
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      };

      window.setInterval(() => {
        registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    } catch (error) {
      console.warn('[PWA] Service worker registration failed:', error);
    }
  };

  register();
  return state;
}
