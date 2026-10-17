import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/responsive.scss';
import './styles/motion.scss';
import './styles/dialog-optimization.scss';
import './styles/dialog-close-fix.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { useAuthStore } from '@/stores/auth.store';
import { initPWA } from '@/pwa';
import { initUpdateCheck } from '@/update-check';

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { BarChart, PieChart, GraphChart } from 'echarts/charts';

use([
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  BarChart,
  PieChart,
  GraphChart,
]);

const app = createApp(App);
const pinia = createPinia();

// Dấu phiên bản build — mở Console (F12) xem "[app] build ..." để biết đang chạy bản nào
try {
  console.log('%c[app] build ' + __BUILD_TIME__, 'color:#409eff;font-weight:bold');
} catch {
  // ignore
}

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);

// Load auth state from localStorage as early as possible
try {
  const authStore = useAuthStore(pinia);
  authStore.checkAuth();
} catch (_e) {
  // ignore
}

app.use(router);
app.use(ElementPlus);
app.use(i18n);

// Initialize PWA (service worker registration, update prompts)
initPWA();

// Tự phát hiện bản build mới (không còn service worker) và nạp lại khi cần
initUpdateCheck();

// Frontend observability: log lỗi JS để debug (có thể mở rộng gửi lên backend sau)
app.config.errorHandler = (err: unknown, _instance, info) => {
  console.error('[App Error]', info, err);
  if (err instanceof Error && err.stack) {
    console.error('[Stack]', err.stack);
  }
};

app.mount('#app');
