/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare module 'element-plus';
declare module 'virtual:pwa-register/vue' {
  import type { Ref } from 'vue';
  export function useRegisterSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (swUrl: string, registration?: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: unknown) => void;
  }): {
    needRefresh: Ref<boolean>;
    offlineReady: Ref<boolean>;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
