import { ref } from 'vue';

export interface PWAUpdateState {
  needRefresh: ReturnType<typeof ref<boolean>>;
  updateServiceWorker: (() => Promise<void>) | undefined;
  offlineReady: ReturnType<typeof ref<boolean>>;
}

let pwaState: PWAUpdateState | null = null;

export function initPWA(): PWAUpdateState {
  if (pwaState) return pwaState;

  const needRefresh = ref(false);
  const offlineReady = ref(false);
  let swUpdateFn: (() => Promise<void>) | undefined;

  try {
    // Dynamic import for PWA register - only works when vite-plugin-pwa is active
    import('virtual:pwa-register/vue').then(({ useRegisterSW }) => {
      const { updateServiceWorker } = useRegisterSW({
        immediate: true,
        onRegisteredSW(swUrl, registration) {
          if (registration) {
            console.log('[PWA] Service Worker registered:', swUrl);
          }
        },
        onNeedRefresh() {
          needRefresh.value = true;
          swUpdateFn = updateServiceWorker;
        },
        onOfflineReady() {
          offlineReady.value = true;
          setTimeout(() => { offlineReady.value = false; }, 5000);
        },
        onRegisterError(error) {
          console.warn('[PWA] Registration error:', error);
        },
      });
    }).catch((e) => {
      console.warn('[PWA] Not available, skipping:', e.message);
    });
  } catch (e: any) {
    console.warn('[PWA] Init skipped:', e.message);
  }

  pwaState = {
    needRefresh,
    updateServiceWorker: swUpdateFn,
    offlineReady,
  };

  return pwaState;
}

export function getPWAState(): PWAUpdateState | null {
  return pwaState;
}
