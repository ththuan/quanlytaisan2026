import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElNotification } from 'element-plus';
import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import i18n from '@/i18n';
import { decodeJwtPayload } from '@/utils/jwt';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/services/authToken';

function t(key: string): string {
  const v = i18n.global?.t?.(key);
  return typeof v === 'string' ? v : key;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Biến để theo dõi lỗi liên tiếp
let consecutiveNetworkErrors = 0;
let lastNotifiedAt = 0;

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
      // Chỉ hiện thông báo lần đầu hoặc khi đã quá 10 giây kể từ lần thông báo cuối
      if (consecutiveNetworkErrors === 1 || now - lastNotifiedAt > 10000) {
        ElNotification.error({
          title: t('common.error'),
          message: t('common.apiErrors.network'),
          duration: 8000,
        });
        lastNotifiedAt = now;
      }
      return Promise.reject(error);
    }

    consecutiveNetworkErrors = 0;
    const responseData = error.response?.data as any;
    const message = responseData?.message || error.message || 'Đã xảy ra lỗi không xác định';

    // Backward compatibility: older role guards returned 401 even though the
    // user was authenticated. A permission failure must not expire the session.
    const isLegacyPermissionDenied =
      error.response?.status === 401 &&
      typeof responseData?.message === 'string' &&
      /access denied|required roles|do not have permission/i.test(responseData.message);

    if (isLegacyPermissionDenied) {
      ElMessage.error(t('common.apiErrors.forbidden'));
      return Promise.reject(error);
    }

    // Handle unauthorized
    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/2fa/validate-login') ||
        error.config?.url?.includes('/auth/refresh');

      if (!isAuthRequest) {
        const hasRetriedAfterRefresh = Boolean((error.config as any)?.__authRefreshRetried);

        if (isRefreshing && !hasRetriedAfterRefresh) {
          return new Promise((resolve, reject) => {
            addRefreshSubscriber((newToken: string) => {
              const retryConfig = { ...error.config! };
              (retryConfig as any).__authRefreshRetried = true;
              retryConfig.headers = retryConfig.headers ?? {};
              retryConfig.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(api(retryConfig));
            });
            setTimeout(() => reject(error), 10000);
          });
        }

        if (!isRefreshing && !hasRetriedAfterRefresh) {
          isRefreshing = true;
          try {
            let res: any;
            try {
              res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 8000 });
            } catch {
              // Nhi?u tab c� th? v?a xoay v�ng cookie; th? l?i m?t l?n.
              await new Promise((resolve) => setTimeout(resolve, 400));
              try {
                res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 8000 });
              } catch (secondError) {
                const status = axios.isAxiosError(secondError) ? secondError.response?.status : undefined;
                if (!status || status >= 500) {
                  ElNotification.error({
                    title: t('common.error'),
                    message: t('common.apiErrors.network'),
                    duration: 8000,
                  });
                  isRefreshing = false;
                  refreshSubscribers = [];
                  return Promise.reject(error);
                }
                throw secondError;
              }
            }

            const newAccessToken: string | undefined = res?.data?.data?.accessToken;
            if (!newAccessToken) throw new Error('Empty access token in refresh response');

            const payload = decodeJwtPayload(newAccessToken);
            if (!payload) throw new Error('Invalid token payload');

            const authStore = useAuthStore();
            if (authStore.user?.id && payload.id && authStore.user.id !== payload.id) {
              console.warn('[Auth] Token refresh returned different user - session overwritten by another tab');
              authStore.clearAuth();
              router.replace('/login');
              isRefreshing = false;
              refreshSubscribers = [];
              return Promise.reject(error);
            }

            setAccessToken(newAccessToken);
            authStore.accessToken = newAccessToken;
            onRefreshed(newAccessToken);
            isRefreshing = false;

            const retryConfig = { ...error.config! };
            (retryConfig as any).__authRefreshRetried = true;
            retryConfig.headers = retryConfig.headers ?? {};
            retryConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return api(retryConfig);
          } catch {
            isRefreshing = false;
            refreshSubscribers = [];
          }
        }

        // Refresh th?t b?i -> dang xu?t
        try {
          const authStore = useAuthStore();
          authStore.clearAuth();
        } catch {
          clearAccessToken();
          localStorage.removeItem('user');
        }
        router.replace('/login');
        ElMessage.error(t('common.apiErrors.sessionExpired'));
      }    } else if (error.response?.status === 403) {
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
