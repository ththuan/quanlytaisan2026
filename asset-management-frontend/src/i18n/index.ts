import { createI18n } from 'vue-i18n';
import vi from './vi';

// Luôn dùng tiếng Việt
const defaultLanguage = 'vi';

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: defaultLanguage,
  fallbackLocale: 'vi',
  messages: {
    vi,
  },
});

export default i18n;

// Helper function (giữ API cũ, nhưng khóa về 'vi')
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter kept for API compatibility
export const setLanguage = (_lang?: 'vi') => {
  i18n.global.locale.value = 'vi';
  localStorage.setItem('language', 'vi');
  document.querySelector('html')?.setAttribute('lang', 'vi');
};

// Helper function to get current language
export const getCurrentLanguage = () => {
  return i18n.global.locale.value;
};
