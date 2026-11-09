export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'app-theme-mode';

export const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage có thể bị chặn
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const applyTheme = (mode: ThemeMode): void => {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = mode;

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // bỏ qua nếu không lưu được
  }
};

export const toggleTheme = (current: ThemeMode): ThemeMode => {
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
