import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/responsive.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { useAuthStore } from '@/stores/auth.store';

// ECharts renderer registration (required by vue-echarts)
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import { BarChart, PieChart, GraphChart } from 'echarts/charts';
use([CanvasRenderer, GridComponent, TooltipComponent, LegendComponent, TitleComponent, BarChart, PieChart, GraphChart]);

const app = createApp(App);
const pinia = createPinia();

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

app.mount('#app');
