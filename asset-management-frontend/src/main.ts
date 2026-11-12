import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/responsive.scss';
import './styles/page-layout.scss';
import './styles/dialog-optimization.scss';
import './styles/dialog-close-fix.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { useAuthStore } from '@/stores/auth.store';
import { initPWA, preparePWA } from '@/pwa';

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

// Chế độ PWA/standalone: dùng để tinh chỉnh giao diện giống ứng dụng riêng.
const isStandalone =
  window.matchMedia?.('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;
document.documentElement.classList.toggle('pwa-standalone', Boolean(isStandalone));

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
app.use(ElementPlus);
app.use(i18n);

// Frontend observability: log lỗi JS để debug (có thể mở rộng gửi lên backend sau)
app.config.errorHandler = (err: unknown, _instance, info) => {
  console.error('[App Error]', info, err);
  if (err instanceof Error && err.stack) {
    console.error('[Stack]', err.stack);
  }
};

const bootstrap = async () => {
  // Gỡ service worker cũ trên Safari trước khi app khởi động để tránh treo/trắng màn hình.
  // Giới hạn thời gian chờ để không chặn app nếu API service worker bị treo.
  try {
    await Promise.race([
      preparePWA(),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]);
  } catch (_e) {
    // ignore
  }

  // Đợi kiểm tra/refresh phiên trước khi router chạy guard, tránh chớp trang login.
  try {
    const authStore = useAuthStore(pinia);
    await authStore.checkAuth();
  } catch (_e) {
    // ignore
  }

  app.use(router);
  app.mount('#app');

  const startPWA = () => {
    try {
      initPWA();
    } catch (error) {
      console.warn('[PWA] Không thể khởi tạo:', error);
    }
  };

  // Safari/iOS có thể treo khi vừa tải app vừa cài service worker/precache.
  // Ưu tiên render giao diện trước, đăng ký PWA sau khi trình duyệt rảnh.
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(startPWA, { timeout: 2000 });
  } else {
    window.setTimeout(startPWA, 1500);
  }
};

bootstrap();
