import { ref } from 'vue';

const STORAGE_KEY = 'qlts:effects-lite';
const ROOT_CLASS = 'effects-lite';

const effectsLite = ref(false);
let storedPreference = false;

const detectLowEndDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  return isMobile || cores <= 4 || memory <= 4;
};

export const initEffectsMode = () => {
  if (typeof window === 'undefined') return effectsLite.value;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  storedPreference = stored !== null;
  const lite = stored === '1' ? true : stored === '0' ? false : detectLowEndDevice();

  effectsLite.value = lite;
  document.documentElement.classList.toggle(ROOT_CLASS, lite);
  return lite;
};

export const effectsLiteNow = () => effectsLite.value;

export const useEffectsLite = () => effectsLite;

export const setEffectsMode = (lite: boolean, persist = true) => {
  effectsLite.value = lite;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle(ROOT_CLASS, lite);
  }
  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lite ? '1' : '0');
    storedPreference = true;
  }
};

export const toggleEffectsMode = () => setEffectsMode(!effectsLite.value);

export const shouldAutoTuneEffects = () =>
  !storedPreference && !effectsLite.value && typeof window !== 'undefined';

/**
 * Nhẹ nhàng theo dõi FPS vài giây sau khi tải trang; nếu máy quá yếu thì tự
 * chuyển sang chế độ ít hiệu ứng để không làm người dùng khó chịu.
 */
export const watchPerformance = () => {
  if (!shouldAutoTuneEffects()) return;

  let frame = 0;
  let frames = 0;
  let start = 0;

  const tick = (now: number) => {
    if (!start) start = now;
    frames += 1;

    const elapsed = now - start;
    if (elapsed < 3000) {
      frame = requestAnimationFrame(tick);
      return;
    }

    const fps = frames / (elapsed / 1000);
    if (fps < 40 && !document.hidden) {
      setEffectsMode(true, false);
    }
  };

  window.setTimeout(() => {
    if (shouldAutoTuneEffects()) frame = requestAnimationFrame(tick);
  }, 1200);

  return () => cancelAnimationFrame(frame);
};
