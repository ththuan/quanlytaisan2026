import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';
import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import i18n from '@/i18n';

function t(key: string): string {
  const v = i18n.global?.t?.(key);
  return typeof v === 'string' ? v : key;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Biến để theo dõi lỗi liên tiếp
let consecutiveNetworkErrors = 0;
let lastNetworkErrorTime = 0;

// Response interceptor với xử lý lỗi mạng thông minh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    consecutiveNetworkErrors = 0;
    return response.data;
  },
  (error: AxiosError) => {
    const now = Date.now();
    
    // Xử lý lỗi mạng
    if (!error.response) {
      consecutiveNetworkErrors++;
      lastNetworkErrorTime = now;
      // Chỉ hiện thông báo nếu lỗi liên tiếp hoặc đã lâu không có lỗi
      if (consecutiveNetworkErrors === 1 || (now - lastNetworkErrorTime > 10000)) {
        ElNotification.error({
          title: t('common.error'),
          message: t('common.apiErrors.network'),
          duration: 8000,
        });
      }
      
      return Promise.reject(error);
    }

    consecutiveNetworkErrors = 0;
    const responseData = error.response?.data as any;
    const message = responseData?.message || error.message || 'Đã xảy ra lỗi không xác định';

    // Handle unauthorized
    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/2fa/validate-login');
      // Đừng clear auth / redirect khi 401 từ chính request đăng nhập/đăng ký — component sẽ hiển thị lỗi (sai mật khẩu, v.v.)
      if (!isAuthRequest) {
        try {
          const authStore = useAuthStore();
          authStore.clearAuth();
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        router.replace('/login');
        ElMessage.error(t('common.apiErrors.sessionExpired'));
      }
    } else if (error.response?.status === 403) {
      ElMessage.error(t('common.apiErrors.forbidden'));
    } else if (error.response?.status === 400) {
      // Validation errors - show detailed message
      ElMessage.error({
        message: message,
        duration: 5000,
        showClose: true,
      });
    } else if (error.response?.status >= 500) {
      ElMessage.error({
        message: `${t('common.apiErrors.serverError')} ${message}`,
        duration: 5000,
        showClose: true,
      });
    } else if (error.response?.status === 404) {
      ElMessage.error(t('common.apiErrors.notFound'));
    } else if (error.response?.status === 429) {
      ElMessage.error({
        message: t('common.apiErrors.rateLimit'),
        duration: 5000,
        showClose: true,
      });
    } else if (error.response?.status === 409) {
      // 409 Conflict - để component (ví dụ xóa phòng ban) tự hiển thị và xử lý (gỡ rồi xóa)
      // Không hiện toast ở đây để tránh trùng và để component show dialog khi cần
    } else {
      // Chỉ hiện lỗi nếu không phải 401/403/404/429/409
      if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 404 && error.response?.status !== 429 && error.response?.status !== 409) {
        ElMessage.error({
          message: message,
          duration: 5000,
          showClose: true,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
