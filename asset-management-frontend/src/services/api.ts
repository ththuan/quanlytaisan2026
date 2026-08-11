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
  timeout: 10000,
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

// Track whether a token refresh is in progress to avoid parallel refresh requests
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const onRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Response interceptor với xử lý lỗi mạng thông minh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    consecutiveNetworkErrors = 0;
    // Cập nhật thời điểm hoạt động cuối cùng mỗi khi có response thành công
    localStorage.setItem('lastActivity', Date.now().toString());
    return response.data;
  },
  async (error: AxiosError) => {
    const now = Date.now();

    // Retry proxy/connection errors (backend restarting) - up to 3 times with delay
    const config = error.config;
    if (config && (!error.response || error.response.status >= 502)) {
      const retryCount = (config as any).__retryCount || 0;
      if (retryCount < 3) {
        (config as any).__retryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }

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
        error.config?.url?.includes('/auth/2fa/validate-login') ||
        error.config?.url?.includes('/auth/refresh');
      // Đừng clear auth / redirect khi 401 từ chính request đăng nhập/đăng ký
      if (!isAuthRequest) {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedRefreshToken && !isRefreshing) {
          isRefreshing = true;
          try {
            const authStore = useAuthStore();
            const currentUserId = authStore.user?.id;
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: storedRefreshToken });
            const newAccessToken: string = (res as any)?.data?.data?.accessToken || (res as any)?.data?.accessToken;
            const newRefreshToken: string | undefined = (res as any)?.data?.data?.refreshToken || (res as any)?.data?.refreshToken;
            if (newAccessToken) {
              // Decode JWT to verify this token still belongs to the same user
              try {
                const payload = JSON.parse(atob(newAccessToken.split('.')[1]));
                if (currentUserId && payload.id && currentUserId !== payload.id) {
                  console.warn('[Auth] Token refresh returned different user — session overwritten by another tab');
                  authStore.clearAuth();
                  router.replace('/login');
                  isRefreshing = false;
                  refreshSubscribers = [];
                  return Promise.reject(error);
                }
              } catch { /* ignore decode errors */ }
              localStorage.setItem('accessToken', newAccessToken);
              if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
              authStore.accessToken = newAccessToken;
              onRefreshed(newAccessToken);
              isRefreshing = false;
              // Retry the original failed request
              const retryConfig = { ...error.config! };
              retryConfig.headers = retryConfig.headers ?? {};
              retryConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return api(retryConfig);
            }
            // newAccessToken empty — fall through to logout
            throw new Error('Empty access token in refresh response');
          } catch {
            isRefreshing = false;
            refreshSubscribers = [];
          }
        } else if (storedRefreshToken && isRefreshing) {
          // Queue requests while refresh is in progress
          return new Promise((resolve, reject) => {
            addRefreshSubscriber((newToken: string) => {
              const retryConfig = { ...error.config! };
              retryConfig.headers = retryConfig.headers ?? {};
              retryConfig.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(api(retryConfig));
            });
            setTimeout(() => reject(error), 10000);
          });
        }
        // No refresh token or refresh failed — logout
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
